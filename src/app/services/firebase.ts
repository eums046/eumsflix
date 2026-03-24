import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || "mock_key",
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || "mock_domain",
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || "mock_project_id",
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || "mock_bucket",
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || "mock_sender",
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || "mock_app_id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
