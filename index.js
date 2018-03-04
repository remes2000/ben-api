const express = require('express')
const mongoose = require('mongoose')
const passport = require('passport')
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const cors = require('cors')
const keys = require('./config/keys')

mongoose.connect(keys.mongoURI)
require('./models/user')
require('./models/highScore')

const app = express()
const server = require('http').createServer(app)

app.use(cors({credentials: true, origin: true}))

const sessionMiddleware = cookieSession({
  name: 'benGame',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  keys: [keys.cookieKey]
})

app.use(bodyParser.json())
app.use(sessionMiddleware)

app.use(passport.initialize())
app.use(passport.session()) 

require('./routes/authRoutes')(app)
require('./routes/gameRoutes')(app)
require('./routes/apiRoutes')(app)
require('./services/passport')

require('./services/socketio')(server, sessionMiddleware)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log("server started")
})