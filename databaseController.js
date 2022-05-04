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
            eMail: req.body.eMail,
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
        flightsData : [],
        licenseData: []
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
                if(snapshot.val()['drone'][droneVirtual]['isFPV'] === "on") {
                    drone.isFPV = "Yes"
                } else {
                    drone.isFPV = "No"
                }
                if(snapshot.val()['drone'][droneVirtual].hasOwnProperty('insurance')) {
                    drone.insurance.companyName = snapshot.val()['drone'][droneVirtual]['insurance']['companyName']
                    drone.insurance.insuranceFile = snapshot.val()['drone'][droneVirtual]['insurance']['insuranceFile']
                }
                myHangarData.droneData.push(drone);
            }
        }

        if(snapshot.val().hasOwnProperty('license')) {
            for(let licenseVirtual in snapshot.val()['license']) {
                var license = {};
                license.licenseName = snapshot.val()['license'][licenseVirtual]['licenseName']
                license.licenseData = snapshot.val()['license'][licenseVirtual]['licenseData']
                myHangarData.licenseData.push(license);
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
    if(req.body.isFPV === undefined) {
        req.body.isFPV = "no";
    }

    var drone = {
        brandName: req.body.brandName,
        modelName: req.body.modelName,
        serialNumber: req.body.serialNumber,
        isFPV: req.body.isFPV,
        flights: 0,
        checklist: {
            NormalFlight: {
                PreFlight: {
                    OperatorID: 'Valid and displayed on aircraft if required by local laws.',
                    WeatherBrief: 'Good to fly.',
                    AircraftVisualInspection: 'Damage free, rotors securely attached and freely moving.',
                    App: 'Latest/Updated',
                    AircraftRCFirmware: 'Latest/Updated',
                    FlySafeDatabase: 'Latest/Updated',
                    SDCard: 'Card with sufficient free space inserted fully and securely.',
                    Batteries: 'Fully charged, including RC.',
                    PhoneTablet: 'Fully charged, WiFi and Bluetooth OFF.'
                },
                PreRotorsOn: {
                    FlightPlanRoute: 'Legal flight location (no FRZ), authorization received or not required.',
                    TakeOffLandingSite: 'Landowner permission received or not required.',
                    InvolvedPersons: 'Briefed.',
                    UninvolvedPersons: 'None in close proximity.',
                    Weather: 'Confirmed as expected from Weather Brief & Note wind direction.',
                    RemoteControl: 'Powered ON and connected to Phone/Tablet and App.',
                    GimbleCoverCamera: 'Cover removed & Lens Clean.',
                    AircraftArms: 'Extended and locked in correct position.',
                    Battery: 'Locked in place and cover closed.',
                    Propellers: 'Secure, no loose screws, rotating freely, spread.',
                    VisionSensors: 'Clean and unobstructed.',
                    RC: 'Power ON, connected to Phone/Tablet and App.',
                    Aircraft: 'Power ON.',
                    AircraftPosition: 'Level surface, clear of obstacles & other hazards.',
                    App: 'Connected to aircraft, Compass & IMU Normal.'

                },
                PreTakeOff: {
                    LossOfSignalAction: 'Set as appropriate for flight (RTH / LAND / HOVER).',
                    RTHHeight: 'Set as appropriate for obstacles in RTH routes.',
                    GPS: 'Healthy lock.',
                    Position: 'Aircraft and RC positions checked correct.',
                    Orientations: 'Aircraft and RC orientations checked correct on the map.',
                    Rotors: 'ON, rotating freely.'
                },
                AfterTakeOff: {
                    HeadHeightHoverTest: 'Stable, in-position hover.',
                    Walkaround: '360º No unexpected noises or vibrations.',
                    Yaw: 'Gimble/Camera 90º down, rotation centre fixed.',
                    Pitch: 'Fordwards/Backwards straight flight achieved, returning to centre.',
                    Roll: 'Left/Right straight flight achieved, returning to centre.',
                    Throttle: 'Climb/Descend straight up and down flight over fixed point.',
                    FlightMode: 'Re-select desired flight mode.',
                },
                PreDeparture: {
                    HomePoint: 'Set or updated and confirmed correct on map.'
                },
                ReturningLanding: {
                    Route: 'Clear. No new obstacles sice departure.',
                    InvolvedPersons: 'Briefed.',
                    UninvolvedPersons: 'Clear of landing area.',
                    LandingArea: 'Clear of obstacles & other hazards.',
                    AircraftPosition: 'Aircraft above landing pad / area.',
                    LandingPad: 'Stable, fixed, level, clear of debris etc.',
                }, 
                PowerDown: {
                    Aircraft: 'On ground.',
                    Rotors: 'Stopped.',
                    VideoRecording: 'Stopped.',
                    Aircraft: 'Power OFF.',
                    RC: 'Power OFF.',
                    Moisture: 'Check and dry if necessary.',
                    GimbleCover: 'On.',
                    PropellerGuard: 'On.',
                    Batteries: 'Store at 30% charge or lower.',
                }
            },
            EmergencyFlight: {
                PotentialConflitMannedAircraft: 'Descend immediately to safest low level possible and manually return to home positon if possible without nearing manned aircraft. Remain low or land until danger has passed.',
                LowBattery: 'Return to home asap either manually or with RTH function.',
                LossRCSignal: 'Aircraft may attempt to retrace flight route in order to regain connection with RC. If this fails, the aircraft will either RTH, hover or attempt to land in its current position according to your settings',
                LossAircraftOrientation: 'Fly slowly forwards AND Yaw slowly in one direction. When the aircraft STOPS moving in the SAME DIRECTION as the yaw it is flying TOWARDS your position'
            }
        }
    }

    if(Object.keys(req.body.companyName) != 0 && Object.keys(req.file) != 0) {
        drone['insurance'] = {
            companyName: req.body.companyName,
            insuranceFile: req.file.buffer.toString('base64')
        }
    }

    var date = new Date();
    drone.dateRegistration = date.getUTCDate() + '/' + (date.getUTCMonth()+1) + '/' + date.getFullYear();

    firebase.database().ref('pilot/' + req.session.user.uid + '/drone/' + req.body.serialNumber).set(drone, (error) => {
        if(!error) {
            callback(false, true);
        } else {
            callback(error, false)
        }
    });
}
async function addLicense (req, callback) {
    var license = {
        licenseData: req.file.buffer.toString('base64'),
        licenseName: req.body.licenseName
    }

    firebase.database().ref('pilot/' + req.session.user.uid + '/license/' + firebase.database().ref('/pilot').push().key).set(license, (error) => {
        if(!error) {
            callback(false, true);
        } else {
            callback(error, false)
        }
    });
}
async function getStartFlying(req, callback) {
    var startFlyingData = {
        pilotData : {},
        droneData : [],
        checkListData : []
    }

    await firebase.database().ref('pilot/' + req.session.user.uid + '/').once('value').then((snapshot) => {
        startFlyingData.pilotData.fullName = snapshot.val()['fullName'];
        startFlyingData.pilotData.uasOperator = snapshot.val()['uasOperator']
        startFlyingData.pilotData.eMail = snapshot.val()['eMail']
        startFlyingData.pilotData.birthDay = snapshot.val()['birthDay']

        if(snapshot.val().hasOwnProperty('drone')) {
            for(let droneVirtual in snapshot.val()['drone']) {
                var drone = {insurance : {}}
                drone.brandName = snapshot.val()['drone'][droneVirtual]['brandName']
                drone.modelName = snapshot.val()['drone'][droneVirtual]['modelName']
                drone.dateRegistration = snapshot.val()['drone'][droneVirtual]['dateRegistration']
                drone.serialNumber = snapshot.val()['drone'][droneVirtual]['serialNumber']
                drone.flights = snapshot.val()['drone'][droneVirtual]['flights']
                if(snapshot.val()['drone'][droneVirtual]['isFPV'] === "on") {
                    drone.isFPV = "Yes"
                } else {
                    drone.isFPV = "No"
                }
                if(snapshot.val()['drone'][droneVirtual].hasOwnProperty('insurance')) {
                    drone.insurance.companyName = snapshot.val()['drone'][droneVirtual]['insurance']['companyName']
                    drone.insurance.insuranceFile = snapshot.val()['drone'][droneVirtual]['insurance']['insuranceFile']
                }
                startFlyingData.droneData.push(drone);
            }
        }
    }).catch((error) => {
        if(error) {
            callback(true, false);
        }
    });

    if(startFlyingData != {}) {
        if(startFlyingData.droneData != []) {
            callback(false, startFlyingData);
        } else {
            callback(true, false)
        } 
    } else {
        callback(true, false);
    }
}

module.exports = {check, userIsConnected, signIn, signUp, getMyHangar, addDrone, addLicense, getStartFlying}