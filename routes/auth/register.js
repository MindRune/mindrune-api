require("dotenv").config();
const express = require("express");
const router = express.Router();
const ethers = require("ethers");
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();
const db = process.env.RUNEBOY_DB

router.post("/", async function (req, res, next) {
  try {
    let data = req.body;
    let account = data.account;

    if (
      !account ||
      account === "" ||
      !ethers.utils.isAddress(account)
    ) {
      console.log(`Register request without valid account.`);
      res.status(400).json({
        success: false,
        msg: "Valid public address not provided.",
      });
      return;
    }

    query = `select * from user_header where account = ?`;
    params = [account];
    user_record = await queryDB
      .getData(query, params, db)
      .then((results) => {
        return results;
      })
      .catch((error) => {
        console.error("Error retrieving data:", error);
      });

    if (user_record == "") {
      query = "INSERT INTO user_header values (?,?,?,?,?,?,?,?,?)";
      nonce = Math.floor(Math.random() * 1000000);
      params = [account, nonce, null, null, null, null, null, null, 0]

      await queryDB
        .getData(query, params, db)
        .then((results) => {
          return results;
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

      query = `select * from user_header where account = ?`;
      params = [account];
      user_record = await queryDB
        .getData(query, params, db)
        .then((results) => {
          return results;
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });
    }

    res.status(200).json({
      success: true,
      nonce: user_record[0].nonce,
      msg: ``,
    });
    return;
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      msg: `Oops, something went wrong! Please try again later.`,
    });
  }
});

module.exports = router;
