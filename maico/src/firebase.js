import { initializeApp } from "firebase/app";
import firebaseConfig from "./firebase.config.js"
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getStorage(app);
const analytics = getAnalytics(app);
export default db;