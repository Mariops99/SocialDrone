const req = require('express/lib/request');
const {v4: uuidv4} = require('uuid');
const checkInputs = require('./checkInputs.js');
const databaseController = require('./databaseController.js')

var XLOCATOR = {}

function check(req) {
    if(checkToken(req)) {
        if(checkSession(req)) {
            if(databaseController.check(req)) {
                if(checkInputs.check(req)) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    } else {    
        return false;
    }

    return checkSession(req) && checkToken(req) && databaseController.check(req) && checkInputs.check(req);
}

function checkSession (req) {
    if(req.originalUrl != '/signIn') {
        if(req.session.user === undefined) {
            return false;
        } else {
            return req.session.user.uid ==  databaseController.userIsConnected();
        }
    } else {
        return true;
    }
}

function getToken (req) {
    XLOCATOR.TOKEN = uuidv4();
    XLOCATOR.ROUTE = req.originalUrl;
    return XLOCATOR;
}

function checkToken (req) {
    var XLOCATOR_TEMP = {TOKEN: req.body.XLOCATOR, ROUTE:req.get('referer').replace(process.env.ENVIROMENT, '')}
    if(Object.entries(XLOCATOR_TEMP).length === 0) {
        return false;
    } else {
        return XLOCATOR.TOKEN == XLOCATOR_TEMP.TOKEN && XLOCATOR.ROUTE == XLOCATOR_TEMP.ROUTE;
    }
}    

module.exports = {getToken, check, checkSession}