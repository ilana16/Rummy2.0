// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXh5V0nRnQZ9Z3jQ9Jw5u8xXZQ5XzZvbw",
  authDomain: "rummy-tile-game.firebaseapp.com",
  projectId: "rummy-tile-game",
  storageBucket: "rummy-tile-game.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef",
  databaseURL: "https://rummy-tile-game-default-rtdb.firebaseio.com"
};

// Initialize Firebase
console.log("Initializing Firebase with config:", JSON.stringify(firebaseConfig));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const database = getDatabase(app);

// Enable more detailed error logging
auth.useDeviceLanguage();

// Log auth state changes for debugging
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("User signed in:", user.uid);
    console.log("User email verified:", user.emailVerified);
    console.log("User is anonymous:", user.isAnonymous);
  } else {
    console.log("User signed out");
  }
});

export { auth, firestore, database };
export default app;
