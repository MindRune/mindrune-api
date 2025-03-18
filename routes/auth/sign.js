require("dotenv").config();
const express = require("express");
const router = express.Router();
const ethers = require("ethers");
const ethUtil = require("ethereumjs-util");
const jwt = require("jsonwebtoken");
const queryTypes = require('../../util/queryTypes');
const queryDB = queryTypes.queryDB();
const db = process.env.RUNEBOY_DB;

router.post("/", async function (req, res, next) {
  try {
    const { account, signature } = req.body;
  
    // Validate account
    if (!account || account === "" || !ethers.utils.isAddress(account)) {
      console.log(`Register request without valid account.`);
      return res.status(400).json({
        success: false,
        msg: "Valid account not provided.",
      });
    }

    // Validate signature
    if (!signature || signature === "") {
      console.log(`Sign request without valid signature.`);
      return res.status(400).json({
        success: false,
        msg: "Valid signature not provided.",
      });
    }
    
    // Get user from db
    const query = `SELECT * FROM user_header WHERE account = ?`;
    const params = [account];
    const user_record = await queryDB.getData(query, params, db)
      .catch((error) => {
        console.error("Error retrieving user data:", error);
        throw new Error("Database error occurred");
      });
  
    // Check if user exists
    if (!user_record || user_record.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "Account not found. Please register first.",
      });
    }

    const user = user_record[0];
    
    // Create appropriate message based on registration status
    const msg = user.registered === 1 
      ? `Please sign nonce ${user.nonce} to authenticate account ownership.` 
      : `${user.nonce}
      
    By signing this message and playing with the MindRune Plugin with the registration key provided to you, you agree to the following terms:

    Granting Permission for Data Use:
    You hereby grant MindRune.xyz permission to access, store, and use any data you submit through the registration key. This includes but is not limited to your Ethereum address, registration information, and any other associated data submitted during the registration process.

    Use of Submitted Data:
    You acknowledge that the data you submit may be used by us for purposes related to the registration process, user management, or providing services related to our application, including analytics, communication, and improving the platform's functionality. We may also use the data to personalize your experience or for other purposes as described in our Privacy Policy.

    No Expiry on Registration Key:
    The registration key issued to you is valid indefinitely, unless explicitly revoked or terminated by us. It is your responsibility to keep this key safe and secure.

    No Refunds or Reversals:
    Once the message is signed and the registration key is issued, it is non-reversible. You cannot undo or withdraw the registration after submitting it, as transactions are final and immutable.

    Security and Privacy:
    We are committed to protecting your privacy. However, you acknowledge and accept that the information submitted may be visible on the blockchain, depending on the platform's settings and public visibility of transactions.

    Limitation of Liability:
    You agree that, to the fullest extent permitted by applicable law, we shall not be held liable for any damage, loss, or risk arising out of your use of the registration key, data submission, or transactions. You understand any token affiliated with MindRune is not an investment vehicle with no speculative value.
    `;
  
    // Verify signature
    const msgHex = ethUtil.bufferToHex(Buffer.from(msg));
    const msgBuffer = ethUtil.toBuffer(msgHex);
    const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
    const signatureBuffer = ethUtil.toBuffer(signature);
    const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
    
    try {
      const publicKey = ethUtil.ecrecover(
        msgHash,
        signatureParams.v,
        signatureParams.r,
        signatureParams.s
      );
      const addressBuffer = ethUtil.publicToAddress(publicKey);
      const recoveredAddress = ethUtil.bufferToHex(addressBuffer);
      
      // Check if address matches
      if (recoveredAddress.toLowerCase() !== account.toLowerCase()) {
        console.log(`Invalid signature provided for account ${account}`);
        return res.status(401).json({
          success: false,
          msg: "Invalid signature. Authentication failed.",
        });
      }
    } catch (error) {
      console.error("Error verifying signature:", error);
      return res.status(400).json({
        success: false,
        msg: "Invalid signature format.",
      });
    }

    // At this point, signature is valid
    
    // Create JWT token
    const token = jwt.sign(
      {
        _id: account,
        address: account,
      },
      process.env.JWT_SECRET,
      { expiresIn: !user.registration_key ? '10y' : '7d' }
    );

    // Update registration key if first time
    if (!user.registration_key) {
      const updateQuery = `UPDATE user_header SET registration_key = ?, registered = ? WHERE account = ?`;
      const updateParams = [token, 1, account];
      
      await queryDB.getData(updateQuery, updateParams, db)
        .catch((error) => {
          console.error("Error updating registration key:", error);
          throw new Error("Database error occurred");
        });
    }

    // Update nonce for next authentication
    const newNonce = Math.floor(Math.random() * 1000000);
    const nonceQuery = `UPDATE user_header SET nonce = ? WHERE account = ?`;
    const nonceParams = [newNonce, account];
    
    await queryDB.getData(nonceQuery, nonceParams, db)
      .catch((error) => {
        console.error("Error updating nonce:", error);
        throw new Error("Database error occurred");
      });

    // Return successful response
    return res.status(200).json({
      success: true,
      token: `Bearer ${token}`,
      user_record: user_record,
      msg: "You are now logged in.",
    });
    
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      msg: "Server error occurred. Please try again later.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;