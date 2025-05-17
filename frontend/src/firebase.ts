// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAwoHqhYl3iaHcmfWssxdqidiApWq4gMq4",
  authDomain: "rummy-93382.firebaseapp.com",
  projectId: "rummy-93382",
  storageBucket: "rummy-93382.firebasestorage.app",
  messagingSenderId: "394934939126",
  appId: "1:394934939126:web:3fe77d033ea9cd2c9bebd7",
  measurementId: "G-54BJMN82TM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
