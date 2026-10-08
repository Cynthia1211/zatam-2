import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  doc,
  getFirestore,
  runTransaction,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8nm8zQR6fiC_3mTQ3hURXNJPR6faKYOU",
  authDomain: "zat-am-main.firebaseapp.com",
  projectId: "zat-am-main",
  storageBucket: "zat-am-main.appspot.com",
  messagingSenderId: "1071341524876",
  appId: "1:1071341524876:web:1908319951cd8f50b2e8a9",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export { doc, onAuthStateChanged, runTransaction, serverTimestamp, signOut };
