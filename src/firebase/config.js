// Firebase Configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCl_SmyFo8uoX9V00UFkVNrqSvjMAAhXOM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "seduabuwitpayment.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "seduabuwitpayment",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "seduabuwitpayment.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "525170063354",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:525170063354:web:3e7424b2d5e20f98065643",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-19CF1WW3VV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize secondary app for creating users without affecting current session
const secondaryApp = initializeApp(firebaseConfig, 'secondary');

// Initialize services
export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;
