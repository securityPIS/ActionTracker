import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCgnPJ3xZ4RhuEv0mMuyhANnUdb3f3rNEs",
  authDomain: "actiontracker-91ea5.firebaseapp.com",
  projectId: "actiontracker-91ea5",
  storageBucket: "actiontracker-91ea5.firebasestorage.app",
  messagingSenderId: "136493828217",
  appId: "1:136493828217:web:f56d743328391bffa2aca8",
  measurementId: "G-J8ZWREQBFJ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
