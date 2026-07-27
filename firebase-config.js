import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8nm8zQR6fiC_3mTQ3hURXNJPR6faKYOU",
  authDomain: "zat-am-main.firebaseapp.com",
  projectId: "zat-am-main",
  storageBucket: "zat-am-main.appspot.com",
  messagingSenderId: "1071341524876",
  appId: "1:1071341524876:web:1908319951cd8f50b2e8a9"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export {
  auth,
  db,
  provider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
};