// Paste your Firebase config below, then deploy.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}

firebase.initializeApp(firebaseConfig)
window.db = firebase.firestore()
window.auth = firebase.auth()
window.storage = firebase.storage()
