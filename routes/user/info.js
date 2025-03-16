require("dotenv").config();
var express = require("express");
var router = express.Router();
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();
const db = process.env.MINDRUNE_DB;

// Updated to get account from URL parameter
router.get("/:account?", async function (req, res) {
  try {
    let query = `SELECT account, alias, img, registered FROM user_header`;
    let conditions = [];
    let params = [];
    
    // Get account from URL parameter instead of request body
    if (req.params.account) {
      conditions.push(`account = ?`);
      params.push(req.params.account);
    }
    
    let whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    query = query + " " + whereClause;
    
    let result = await queryDB
      .getData(query, params, db)
      .then((results) => {
        //console.log('Query results:', results);
        return results;
        // Use the results in your variable or perform further operations
      })
      .catch((error) => {
        console.error("Error retrieving data:", error);
      });
      
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      msg: `Oops, something went wrong! Please try again later.`,
    });
  }
});

module.exports = router;