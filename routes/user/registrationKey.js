require("dotenv").config();
var express = require("express");
var router = express.Router();
const web3passport = require("../../util/auth/passport");
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();
const db = process.env.MINDRUNE_DB;

router.post(
  "/",
  web3passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    try {
      const account = req.user[0].account;

      let query = `SELECT registration_key FROM user_header WHERE account = ?`;
      let registration_key = await queryDB
        .getData(query, [account], db)
        .then((results) => results)
        .catch((error) => {
          console.error("Error retrieving current image:", error);
          throw error;
        });
      res.status(200).json({
        success: true,
        result: registration_key,
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({
        success: false,
        msg: `Oops, something went wrong! Please try again later.`,
      });
    }
  }
);
module.exports = router;
