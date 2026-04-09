import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import firebase from "firebase/compat/app";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyBILZI-dNNNBc5BkXpG8elHvie1Ud43Ddo",
  authDomain: "solar-planner-d151a.firebaseapp.com",
  projectId: "solar-planner-d151a",
  storageBucket: "solar-planner-d151a.firebasestorage.app",
  messagingSenderId: "566949091393",
  appId: "1:566949091393:web:b66a2b19e401de8265cec0",
  measurementId: "G-HS4EP73130",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
const analytics = getAnalytics(app);

export default app;
