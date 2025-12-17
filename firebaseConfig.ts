import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
//import { getAnalytics } from "firebase/analytics";

// TODO: Ganti dengan konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyBoxRyW-dxTZmjvSGQe32P2-r2PiVJ-oe0",
  authDomain: "allyshop-b128a.firebaseapp.com",
  projectId: "allyshop-b128a",
  storageBucket: "allyshop-b128a.firebasestorage.app",
  messagingSenderId: "376999251984",
  appId: "1:376999251984:web:15445c2ed9e9cf4fd77a95"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
