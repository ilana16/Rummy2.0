// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwoHqhYl3iaHcmfWssxdqidiApWq4gMq4",
  authDomain: "rummy-93382.firebaseapp.com",
  projectId: "rummy-93382",
  storageBucket: "rummy-93382.firebasestorage.app",
  messagingSenderId: "394934939126",
  appId: "1:394934939126:web:3fe77d033ea9cd2c9bebd7",
  measurementId: "G-54BJMN82TM",
  databaseURL: "https://rummy-93382-default-rtdb.firebaseio.com"
};

// Initialize Firebase
console.log("Initializing Firebase with config:", JSON.stringify(firebaseConfig));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const database = getDatabase(app);
let analytics = null;

// Initialize analytics only in browser environment
try {
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.log("Analytics initialization skipped:", error.message);
}

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

export { auth, firestore, database, analytics };
export default app;
