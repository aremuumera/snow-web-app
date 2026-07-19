import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const ST_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "atrader-54ae9.firebasestorage.app";
// const ST_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "breppo-app-9d2fa.firebasestorage.app";
// 

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDDoyHOWyH9kQ62SwjC4a3zwOr4srzL9Ds",
  authDomain: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "atrader-54ae9"}.firebaseapp.com`,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "atrader-54ae9",
  // apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBMtSPuTwAn3sgafy_b8X_JOR4jn_O5hcs",
  // authDomain: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "breppo-app-9d2fa"}.firebaseapp.com`,
  // projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "breppo-app-9d2fa",
  storageBucket: ST_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "389902445630",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:389902445630:android:c0aecd95f229086731756f",
  //   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "3924657427",
  // appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:3924657427:android:5d1ae4e4601a866ad3c6e6",
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { app, db, storage, auth };
