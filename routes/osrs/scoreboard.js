require("dotenv").config();
const express = require("express");
const router = express.Router();
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();
const db = process.env.MINDRUNE_DB;

// Updated to get account from URL parameter with fallback query
router.get("/:account?", async function (req, res) {
  try {
    // Build the base query
    const baseQuery = `SELECT th.receiver as account, sum(th.points) as points, MAX(uh.alias) as alias, MAX(uh.img) as img FROM txn_header th LEFT JOIN user_header uh on th.receiver = uh.account`;
    
    // First attempt - with account parameter if provided
    if (req.params.account) {
      const accountQuery = `${baseQuery} WHERE th.receiver = ? GROUP BY receiver`;
      const result = await queryDB
        .getData(accountQuery, [req.params.account], db)
        .catch((error) => {
          console.error("Error retrieving data with account parameter:", error);
          throw error;
        });
      
      return res.status(200).json({
        success: true,
        data: result
      });
    }
    
    // Second attempt - no account filter (fallback)
    const allAccountsQuery = `${baseQuery} GROUP BY receiver`;
    const allResults = await queryDB
      .getData(allAccountsQuery, [], db)
      .catch((error) => {
        console.error("Error retrieving data for all accounts:", error);
        throw error;
      });
    
    return res.status(200).json({
      success: true,
      data: allResults,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      msg: `Oops, something went wrong! Please try again later.`,
    });
  }
});

module.exports = router;