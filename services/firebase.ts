import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// NOTE: These are placeholders. In a real environment, these would be populated via env variables.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Robust check for active configuration
export const isFirebaseConfigured = 
    firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && 
    !firebaseConfig.apiKey.includes("YOUR_") &&
    firebaseConfig.apiKey.length > 10;

let app;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase initialization error:", e);
  }
}

export const getFirebaseStatus = () => {
    return {
        configured: isFirebaseConfigured,
        authReady: !!auth,
        dbReady: !!db
    };
};

export { app, auth, db };
export default app;