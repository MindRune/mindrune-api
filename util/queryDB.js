const mindrune_db = require("../config/mindrune_db");

module.exports = executeQuery = async (query, params, db) => {
  return new Promise(async (resolve, reject) => {
    let pool;

    // Assign the pool based on the blockchain or network
    if (db === "mindrune_db") pool = mindrune_db;

    // Get a connection from the pool
    mindrune_db.getConnection((err, connection) => {
      if (err) {
        return reject(err); // Handle connection error
      }

      // Perform the query using the connection
      connection.query(query, params, (error, results) => {
        // Release the connection back to the pool
        connection.release();

        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  });
};
