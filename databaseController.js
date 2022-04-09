require('dotenv').config()
const checkRequest = require('./checkRequest.js')

var firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId,
    measurementId: process.env.measurementId
}

//const app = initializeApp(firebaseConfig);

function check(req) {
    return true;
}

async function signIn(req) {

}

module.exports = {check}