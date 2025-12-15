import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
//import { getAnalytics } from "firebase/analytics";

// TODO: Ganti dengan konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyDptYQiTEMlo5Vgzke7SWT-iBE2yf5d1g0",
  authDomain: "myfirts-a5746.firebaseapp.com",
  projectId: "myfirts-a5746",
  storageBucket: "myfirts-a5746.firebasestorage.app",
  messagingSenderId: "513666249107",
  appId: "1:513666249107:web:b846bd82e8586423b3b866",
  measurementId: "G-158H4MHBCV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
