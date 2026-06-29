import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase Web config (these values are safe to expose in client code).
const firebaseConfig = {
  apiKey: "AIzaSyBQ5m7lEx5qWIfug5TxIZtxddsu5M4ywIQ",
  authDomain: "wlpro-c9e0e.firebaseapp.com",
  projectId: "wlpro-c9e0e",
  storageBucket: "wlpro-c9e0e.firebasestorage.app",
  messagingSenderId: "668975926079",
  appId: "1:668975926079:web:8ccf124515f3b8ed12218a",
  measurementId: "G-M2SQ29HJ3Z",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export default app;
