import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// 1. Add the Storage import
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAP_EiIXJbuotfNQFcjNt7AUCCtZNEQVm4",
  authDomain: "federationswiftthrift.firebaseapp.com",
  projectId: "federationswiftthrift",
  storageBucket: "federationswiftthrift.firebasestorage.app",
  messagingSenderId: "21373083719",
  appId: "1:21373083719:web:b2db45afd4895c1db4d162",
  measurementId: "G-7Q6XCX3N0P"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// 2. Initialize Storage
const storage = getStorage(app); 

console.log("SYS :: Firebase Core Online.");

// 3. Export storage so the eCom module can use it
export { app, auth, db, storage };