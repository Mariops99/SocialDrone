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

function userIsConnected () {
    return firebase.auth().currentUser.uid;
}

async function signIn (req, callback) {
    firebase.auth().signInWithEmailAndPassword(req.body.eMail, req.body.password)
    .then((userCredential) => {
        callback(false, userCredential);
    }).catch((error) => {
        if(error) {
            callback(error.code, false)
        }
    });
}

async function signUp (req, callback) {
    firebase.auth().createUserWithEmailAndPassword(req.body.eMail, req.body.password).then((userCredential) => {
        firebase.database().ref('pilot/' + userCredential.user.uid + '/').set({
            fullName: req.body.fullName,
            uasOperator: req.body.pilotID,
            birthDay: req.body.birthDay,
            eMail: req.body.eMail
        }, (error) => {
            if(!error) {
                callback(false, userCredential);
            }
        });
    }).catch((error) => {
        if(error) {
            callback(error.code, false)
        }
    });
}

async function getMyHangar (req, callback) {
    var myHangarData = {
        pilotData : {},
        droneData : [],
        flightsData : []
    }

    await firebase.database().ref('pilot/' + req.session.user.uid + '/').once('value').then((snapshot) => {
        myHangarData.pilotData.fullName = snapshot.val()['fullName'];
        myHangarData.pilotData.uasOperator = snapshot.val()['uasOperator']
        myHangarData.pilotData.eMail = snapshot.val()['eMail']
        myHangarData.pilotData.birthDay = snapshot.val()['birthDay']

        if(snapshot.val().hasOwnProperty('drone')) {
            for(let droneVirtual in snapshot.val()['drone']) {
                var drone = {insurance : {}}
                drone.brandName = snapshot.val()['drone'][droneVirtual]['brandName']
                drone.modelName = snapshot.val()['drone'][droneVirtual]['modelName']
                drone.dateRegistration = snapshot.val()['drone'][droneVirtual]['dateRegistration']
                drone.serialNumber = snapshot.val()['drone'][droneVirtual]['serialNumber']
                drone.flights = snapshot.val()['drone'][droneVirtual]['flights']
                if(snapshot.val()['drone'][droneVirtual].hasOwnProperty('insurance')) {
                    drone.insurance.companyName = snapshot.val()['drone'][droneVirtual]['insurance']['companyName']
                    drone.insurance.insuranceFile = snapshot.val()['drone'][droneVirtual]['insurance']['insuranceFile']
                }
                myHangarData.droneData.push(drone);
            }
        }

        if(snapshot.val().hasOwnProperty('flights')) {
            for(let flights in snapshot.val()['flights']) {
                myHangarData.flightsData.push(flights)
            }
        }
        
    }).catch((error) => {
        if(error) {
            callback(true, false);
        }
    });

    if(myHangarData != {}) {
        callback(false, myHangarData);
    } else {
        callback(true, false);
    }
}
async function addDrone (req, callback) {
    var drone = {
        brandName: req.body.brandName,
        modelName: req.body.modelName,
        serialNumber: req.body.serialNumber,
        flights: 0
    }

    if(Object.keys(req.body.companyName) != 0 && Object.keys(req.file) != 0) {
        drone['insurance'] = {
            companyName: req.body.companyName,
            insuranceFile: req.file.buffer.toString('base64')
        }
    }

    var date = new Date();
    drone.dateRegistration = date.getUTCDate() + '/' + (date.getUTCMonth()+1) + '/' + date.getFullYear();

    firebase.database().ref('pilot/' + req.session.user.uid + '/drone/' + firebase.database().ref('/pilot').push().key).set(drone, (error) => {
        if(!error) {
            callback(false, true);
        } else {
            callback(error, false)
        }
    });
}

module.exports = {check, userIsConnected, signIn, signUp, getMyHangar, addDrone}