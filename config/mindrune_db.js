require('dotenv').config()
const mysql = require('mysql')

const pool = mysql.createPool({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.MINDRUNE_DB,
    waitForConnections: true,
    connectionLimit: 1000, // Adjust this based on your requirements
    queueLimit: 0
})

module.exports = pool;