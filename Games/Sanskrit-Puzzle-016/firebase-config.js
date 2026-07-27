import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB6gCO3IOjDSCHJNK08C8MEw47Wlwf2_AE",
  authDomain: "zatam-to-zim.firebaseapp.com",
  projectId: "zatam-to-zim",
  storageBucket: "zatam-to-zim.firebasestorage.app",
  messagingSenderId: "1003568725487",
  appId: "1:1003568725487:web:3398e0dc55ece1d3548a1a",
  measurementId: "G-Q5GM8ZN9TG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

export {
  collection,
  addDoc,
  serverTimestamp
};