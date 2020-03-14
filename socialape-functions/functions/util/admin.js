const admin = require('firebase-admin');
require("firebase/firestore");
require('@google-cloud/firestore');

var serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: ''
  });

const db = admin.firestore();

module.exports = { admin, db };
