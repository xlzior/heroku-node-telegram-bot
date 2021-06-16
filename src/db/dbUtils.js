const firebase = require('firebase');
const firebaseConfig = require('../firebaseConfig');
firebase.initializeApp(firebaseConfig);

const dbRef = firebase.database().ref();
const usersDbRef = dbRef.child('users');

const getUserDb = userId => usersDbRef.child(userId);

const getFb = db => {
  return db.get()
  .then(snapshot => {
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return Promise.reject("No snapshot");
    }
  })
}

module.exports = {
  getUserDb,
  getFb,
}