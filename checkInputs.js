var inputsNeeded = {
    signUp: ['fullName', 'birthDay', 'eMail', 'pilotID', 'password'] ,
    signIn: ['eMail', 'password'],
    addDrone: ['brandName', 'modelName', 'serialNumber', 'isFPV'],
    uploadLicense: ['licenseName'],
    openFile: ['fileBase64'],
    saveFlight: ['droneData', 'locationName', 'flightTime', 'maxAltitude', 'maxDistance', 'flightTimeDuration', 'isPublic']
}
var inputTypes = {
    signUp: {fullName: 'string', birthDay: 'string', eMail: 'string', pilotID: 'string', password: 'string'},
    signIn: {eMail: 'string', password: 'string'},
    addDrone: {brandName: 'string', modelName: 'string', serialNumber: 'string', isFPV: 'string'},
    uploadLicense: {licenseName: 'string'},
    openFile: {fileBase64: 'string'},
    saveFlight: {droneData: 'string', locationName: 'string', flightTime: 'string', maxAltitude: 'string', maxDistance: 'string', flightTimeDuration: 'string', isPublic: 'number'}
}

let regex = /[a-zA-Z0-9]/

function check(req) {
    var inputsParsed = JSON.parse(JSON.stringify(req.body))
    var originalUrl = req.originalUrl.substring(1, req.originalUrl.length);
    for (let element of inputsNeeded[originalUrl]) {
        if(inputsParsed.hasOwnProperty(element)) {
            if(Object.keys(req.body[element]).length !== 0) {
                if(!sanitizeInput(req.body[element], inputTypes[originalUrl][element])) {
                    return false;
                }
            }       
        }
    } 
    return true;
}

function sanitizeInput (input, type) {
    if (typeof input === type) {
        return regex.test(input);
    } else {
        return false;
    }
}

module.exports = {check}