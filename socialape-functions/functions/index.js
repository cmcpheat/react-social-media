const functions = require('firebase-functions');
require("firebase/firestore");

const app = require('express')();

const FBAuth = require('./util/fbAuth');

const { db } = require('./util/admin');

// Import scream functions
const {
    getAllScreams,
    postOneScream,
    getScream,
    commentOnScream,
    likeScream,
    unlikeScream,
    deleteScream
} = require('./handlers/screams');

// Import user functions
const {
    signup,
    login,
    uploadImage,
    addUserDetails,
    getAuthenticatedUser,
    getUserDetails,
    markNotificationsRead
} = require('./handlers/users');

// Scream routes
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', getScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream );
app.get('/scream/:screamId/like', FBAuth, likeScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);

// Account routes
app.post('/signup', signup);
app.post('/login', login);

// User routes
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

exports.api = functions.region('europe-west1').https.onRequest(app);

// TODO: Own user doesn't get notified
exports.createNotificationOnLike = functions
.region('europe-west1')
.firestore.document('likes/{id}')
.onCreate((snapshot) => {
    console.log("this is onLike test");
    return db.doc(`/screams/${snapshot.data().screamId}`) // .doc rather than .document
        .get() 
        .then((doc) => {
            if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'like',
                    read: false,
                    screamId: doc.id
                });
            };
        })
        // .then(() => {
        //     return;
        // })
        .catch((err) =>
            console.error(err));
});

exports.deleteNotificationOnUnlike = functions
.region('europe-west1')
.firestore.document('likes/{id}')
.onDelete((snapshot) => {
    return db.doc(`/notifications/${snapshot.id}`)
        .delete()
        .catch(err => {
            console.error(err);
            return;
        })
});

// TODO: Own user doesn't get notified
exports.createNotificationOnComment = functions
.region('europe-west1')
.firestore.document('comments/{id}')
.onCreate((snapshot) => {
    console.log("this is onComment test");
    return db.doc(`/screams/${snapshot.data().screamId}`) // .doc rather than .document
        .get()
        .then((doc) => { 
            if (
                doc.exists && 
                doc.data().userHandle !== snapshot.data().userHandle
            ) {
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'comment',
                    read: false,
                    screamId: doc.id
                });
            };
        })
        .catch((err) =>
            console.error(err));
});

exports.onUserImageChange = functions
    .region('europe-west1')
    .firestore.document('/users/{userId}')
    .onUpdate((change) => {
        console.log(change.before.data());
        console.log(change.after.data());
        if(change.before.data().imageUrl !== change.after.data().imageUrl) {
            console.log('image has changed');
            const batch = db.batch();
            return db.collection('screams').where('userHandle', '==', change.before.data().handle).get()
                .then((data) => {
                    data.forEach(doc => {
                        const scream = db.doc(`/screams/${doc.id}`);
                        batch.update(scream, { userImage: change.after.data().imageUrl });
                    })
                    return batch.commit();
                });
        } else return true;
    });

exports.onScreamDelete = functions
    .region('europe-west1')
    .firestore.document('/screams/{screamId}')
    .onDelete((snapshot, context) => {
        const screamId = context.params.screamId;
        const batch = db.batch();
        return db.collection('comments').where('screamId', '==', screamId).get()
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/comments/${doc.id}`));
                })
                return db.collection('likes').where('screamId', '==', screamId).get();
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/likes/${doc.id}`));
                })
                return db.collection('notifications').where('screamId', '==', screamId).get();
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/notifications/${doc.id}`));
                })
                return batch.commit();
            })
            .catch(err => console.error(err));
    });
