const express = require('express')
const bodyParser = require("body-parser");
require('dotenv').config()
const app = express()
const multer  = require('multer');
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

const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/insuraceCoverage');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "--" + file.originalname)
  } 
})
const upload = multer({storage: multer.memoryStorage()});

app.use(express.static(__dirname + '/public'));
app.use(session(cookieSession));

const checkRequest = require('./checkRequest.js')
const databaseController = require('./databaseController.js')

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(bodyParser.urlencoded({ extended: false }));

//Landing Page
app.get('/', (req, res) => {
  res.render('home')
})

//GET & POST (SignIn, SignUp & Logout)
app.get('/start', (req, res) => {  
    res.render('login', {info: null, XLOCATOR: checkRequest.getToken(req).TOKEN})
});

app.post('/signIn', (req, res) => {
    if(checkRequest.check(req)){
      databaseController.signIn(req, function(error, userCredential) {
        if(error) {
          res.render('login', {info: 'Something went wrong!\n Error code: ' + error, XLOCATOR: checkRequest.getToken(req).TOKEN})
        } else {
          req.session.user = userCredential.user;
          return res.redirect('/myHangar');
        }
      });
    } else {
      res.render('login', {info: 'Something went wrong!', XLOCATOR: checkRequest.getToken(req).TOKEN})
    }
})

app.get('/newPilot', (req, res) => {
  res.render('newPilot', {info:null, XLOCATOR: checkRequest.getToken(req).TOKEN})
});

app.post('/signUp', (req, res) => {
  if(checkRequest.check(req)) {
    databaseController.signUp(req, function(error, userCredential) {
      if(error) {
        res.render('newPilot', {info: 'Something went wrong!\n Error code: ' + error, XLOCATOR: checkRequest.getToken(req).TOKEN})
      } else {
        req.session.user = userCredential.user;
        return res.redirect('/start');
      }
    });
  } else {
    res.redirect('/')
  }
});

app.get('/logout', (req, res) => {
  if(checkRequest.checkSession(req)) {
    req.session.destroy(function (err) {
      if(!err) {
        res.redirect('/')
      } else {
        res.redirect('/')
      }
    })
  }
})

//GET & POST (MyHangar)
app.get('/myHangar', (req, res) => {
  if(checkRequest.checkSession(req)) {
    databaseController.getMyHangar(req, function (err, myHangar) {
      res.render('myHangar', {myHangarData: myHangar, XLOCATOR: checkRequest.getToken(req).TOKEN})
    });
  } else {
    res.redirect('/');
  }
})

app.post('/addDrone', upload.single('insuranceFile'), (req, res, next) => {
  if(checkRequest.check(req)) {
    databaseController.addDrone(req, function (err, droneResoult) {
      if(droneResoult) {
        res.redirect('/myHangar')
      }
    }); 
  } else {
    res.redirect('/')
  }
});

//App start message
app.listen(port, () => {
  console.log(`SocialDrone running on http://localhost:${port}`)
})