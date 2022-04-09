const express = require('express')
const bodyParser = require("body-parser");
require('dotenv').config()
const app = express()
const port = 80
const {v4: uuidv4} = require('uuid');

var session = require('express-session');
const redis = require('redis');
const redisStore = require('connect-redis')(session);
const client  = redis.createClient({legacyMode: true});
client.connect();

var cookieSession = {
  secret: uuidv4(),
  store: new redisStore({ host: 'localhost', port: 6379, client: client,ttl : 260}),
  maxAge: 60000,
  cookie: {
      secure: false
  },
  resave: false,
  saveUninitialized: false
}

app.use(express.static(__dirname + '/public'));
app.use(session(cookieSession));

const checkRequest = require('./checkRequest.js')

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(bodyParser.urlencoded({ extended: false }));

//Landing Page
app.get('/', (req, res) => {
  res.render('home')
})

//GET & POST (SignIn & SignUp)
app.get('/start', (req, res) => {
    res.render('login', {info: null, XLOCATOR: checkRequest.getToken(req).TOKEN})
});

app.post('signIn', (req, res) => {
    if(checkRequest.check(req)){

    } else {
      res.redirect('/')
    }
})

app.get('/newPilot', (req, res) => {
  res.render('newPilot', {info:null, XLOCATOR: checkRequest.getToken(req).TOKEN})
});

app.post('/signUp', (req, res) => {
  if(checkRequest.check(req)) {
    res.redirect('/start')
  } else {
    res.redirect('/')
  }
});




//App start message
app.listen(port, () => {
  console.log(`SocialDrone running on http://localhost:${port}`)
})