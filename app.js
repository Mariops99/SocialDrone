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
  maxAge: 1000 * 60 * 60 * 24 * 7,
  cookie: {
      secure: false
  },
  resave: false,
  saveUninitialized: false
}

const upload = multer({storage: multer.memoryStorage()});

app.use(express.static(__dirname + '/public'));
app.use(session(cookieSession));

const checkRequest = require('./checkRequest.js')
const databaseController = require('./databaseController.js')

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(bodyParser.urlencoded({limit: '50mb',extended: false }));

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

app.post('/uploadLicense', upload.single('licenseFile'), (req, res, next) => {
  if(checkRequest.check(req)) {
    databaseController.addLicense(req, function (err, licenseResoult) {
        res.redirect('/myHangar')
    });
  } else {
    res.redirect('/')
  }
});

app.post('/openFile', (req, res) => {
  if(checkRequest.check(req)) {
    res.write(req.body.file, 'base64');
    res.end();
  } else {
    res.redirect('/')
  }
});

//GET & POST (StartFlying)
app.get('/startFlying', (req, res) => {
  if(checkRequest.checkSession(req)) {
    databaseController.getStartFlying(req, (error, startFlying) => {
      if(error) {
        res.redirect('/myHangar')
      } else {
        res.render('startFlying', {startFlyingData: startFlying, XLOCATOR: checkRequest.getToken(req).TOKEN})
      }
    });
  } else {
    res.redirect('/')
  }
});

app.post('/saveFlight', (req, res) => {
  if(checkRequest.check(req)) {
  
  }
  console.log(req.body);
});

//App start message
app.listen(port, () => {
  console.log(`SocialDrone running on http://192.168.0.82:${port}`)
})