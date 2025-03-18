require("dotenv").config();
const mysql = require("mysql");
const default_rate = process.env.DEFAULT_RATE_MIN;
const create_rate = process.env.CREATE_RATE_MIN;
const mindrune_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.MINDRUNE_DB,
});

function executeMINDRUNEQuery(query, params) {
  return new Promise((resolve, reject) => {
    mindrune_connection.query(query, params, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

async function getMINDRUNEData(query, params) {
  try {
    const results = await executeMINDRUNEQuery(query, params);
    return results;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

module.exports = async function actionSpam(request, account) {
  console.log(`Checking if ${account} is spamming with request type: ${request}`);
  
  // First check if user exists
  let query = `SELECT * FROM user_header WHERE account = ?`;
  let params = [account];
  const user_record = await getMINDRUNEData(query, params)
    .then((results) => {
      return results;
    })
    .catch((error) => {
      console.error("Error retrieving user data:", error);
      return null;
    });

  if (!user_record || user_record.length === 0) {
    return { permission: "block" };
  }

  // Different rate limiting logic based on request type
  if (request === "create") {
    // For create transactions, check if there's any create action within the last 59 seconds
    const create_query = `
      SELECT * FROM txn_header 
      WHERE receiver = ? 
      AND request = 'create'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 45 SECOND)
    `;
    const create_params = [account];
    
    const recent_creates = await getMINDRUNEData(create_query, create_params)
      .then((results) => {
        return results;
      })
      .catch((error) => {
        console.error("Error retrieving create transaction data:", error);
        return [];
      });
    
    console.log(`Found ${recent_creates.length} recent create transactions for account ${account}`);
    
    // If any create transactions found in the last 59 seconds, block the request
    if (recent_creates.length > 0) {
      return { permission: "block" };
    }
  } else {
    // For non-create transactions, use the default rate limiting logic
    const default_query = `
      SELECT * FROM txn_header 
      WHERE receiver = ? 
      AND UNIX_TIMESTAMP(NOW()) - created_at <= 60
    `;
    const default_params = [account];
    
    const request_frequency = await getMINDRUNEData(default_query, default_params)
      .then((results) => {
        return results;
      })
      .catch((error) => {
        console.error("Error retrieving default transaction data:", error);
        return [];
      });
    
    // Check if the frequency exceeds the default rate
    if (Number(default_rate) < request_frequency.length) {
      return { permission: "block" };
    }
  }
  
  // If we've passed all checks, allow the transaction
  return { permission: "allow" };
};