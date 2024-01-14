import { initializeApp } from "firebase/app";
import firebaseConfig  from "./firebase.config.js"
import { getStorage } from "firebase/storage";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getStorage(app);
export default db;