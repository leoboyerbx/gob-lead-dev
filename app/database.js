const app = require('firebase-admin');
const { applicationDefault } = require('firebase-admin/app');

app.initializeApp({
  credential: applicationDefault(),
  databaseURL: 'https://leadtechnique2022-default-rtdb.firebaseio.com/',
});
module.exports = {
  db: app.database()
}
