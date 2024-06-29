// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "reactchat-b8edc.firebaseapp.com",
  projectId: "reactchat-b8edc",
  storageBucket: "reactchat-b8edc.appspot.com",
  messagingSenderId: "902605395511",
  appId: "1:902605395511:web:93967a0bfc6bf0b37151b2"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()

const updateUserStatus = async (userId, isOnline) => {
  const userStatusRef = doc(db, "status", userId);
  try {
    await setDoc(userStatusRef, {
      isOnline: isOnline,
      lastSeen: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating user status: ", error);
  }
};

export { updateUserStatus };
