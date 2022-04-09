require('dotenv').config()
const firebase = require("firebase/app");
require("firebase/database");
require("firebase/auth");
const checkRequest = require('./checkRequest.js')

var firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    databaseURL: process.env.databaseURL,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId,
    measurementId: process.env.measurementId
}

firebase.initializeApp(firebaseConfig);

var database = firebase.database();

function check(req) {
    return true;
}

async function signIn(req, callback) {
    firebase.auth().signInWithEmailAndPassword(req.body.eMail, req.body.password)
    .then((userCredential) => {
        callback(false, userCredential);
    })
}

async function signUp(req, callback) {
    firebase.auth().createUserWithEmailAndPassword(req.body.eMail, req.body.password)
    .then((userCredential) => {
        firebase.database().ref('pilot/' + userCredential.user.uid).set({
            fullName: req.body.fullName,
            uasOperator: req.body.pilotID,
            birthDay: req.body.birthDay,
            eMail: req.body.eMail
        }, (error) => {
            if(!error) {
                callback(false, userCredential);
            }
        });    
    });
}
module.exports = {check, signIn, signUp}