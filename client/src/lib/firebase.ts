import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Check if Firebase credentials are available
const isFirebaseConfigured = 
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_PROJECT_ID && 
  import.meta.env.VITE_FIREBASE_APP_ID;

// Create a dummy auth service if Firebase is not configured
let auth: ReturnType<typeof getAuth>;
let googleProvider: GoogleAuthProvider;

if (isFirebaseConfigured) {
  // Firebase configuration with real credentials
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  // Initialize Firebase Authentication
  auth = getAuth(app);
  
  // Create Google Auth Provider
  googleProvider = new GoogleAuthProvider();
} else {
  console.warn("Firebase configuration missing. Google authentication will not work.");
  // Create placeholder objects to prevent app crashes
  const dummyApp = {} as any;
  auth = {
    currentUser: null,
  } as any;
  googleProvider = {} as any;
}

export { auth, googleProvider };