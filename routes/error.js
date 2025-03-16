require('dotenv').config()
var express = require('express')
var router = express.Router()

router.get('/', async function (req, res) {
  res.status(404).json({
    success: false,
    msg: "Path not found.",
  });
})

module.exports = router
