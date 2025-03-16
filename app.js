require('dotenv').config()
const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'node_modules')))
app.use('/dkg', express.static(__dirname + 'node_modules/dkg.js'))
app.use('/util', express.static(__dirname + 'public/util'))
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(bodyParser.text({ limit: '200mb' }));
app.use(cors())

//osrs
const osrsCreateRouter = require('./routes/osrs/create')
const osrsScoreboardRouter = require('./routes/osrs/scoreboard')
const osrsQueryRouter = require('./routes/osrs/query')
const osrsMemoriesRouter = require('./routes/osrs/memories')

//auth
const authRegisterRouter = require('./routes/auth/register')
const authSignRouter = require('./routes/auth/sign')

//users
const userInfoRouter = require('./routes/user/info')
const userEditRouter = require('./routes/user/edit')
const registrationKeyRouter = require('./routes/user/registrationKey')

//-----

//osrs
app.use('/osrs/create', osrsCreateRouter)
app.use('/osrs/scoreboard', osrsScoreboardRouter)
app.use('/osrs/query', osrsQueryRouter)
app.use('/osrs/memories', osrsMemoriesRouter)

//users
app.use('/user/info', userInfoRouter)
app.use('/user/edit', userEditRouter)
app.use('/user/registrationKey', registrationKeyRouter)

//auth
app.use('/auth/register', authRegisterRouter)
app.use('/auth/sign', authSignRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.json({ result: 'Invalid Path.' })
})

module.exports = app
