// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAshFTu2kCl82K46TEsfEnbkDbQKHMKR2M",
  authDomain: "todo-9bbb0.firebaseapp.com",
  projectId: "todo-9bbb0",
  storageBucket: "todo-9bbb0.appspot.com",
  messagingSenderId: "179410247658",
  appId: "1:179410247658:web:8a570a322c529438855c93",
  measurementId: "G-VLF3Y2G8QC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();

// Store user profile in Firestore
const saveUserToFirestore = async (user: any) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
    };
    try {
        await setDoc(userRef, userData, { merge: true });
    } catch (error) {
        console.error("Error saving user to Firestore:", error);
    }
};

onAuthStateChanged(auth, (user) => {
    saveUserToFirestore(user);
});


export const signInWithGoogle = () => {
  signInWithPopup(auth, provider)
    .then(result => {
        saveUserToFirestore(result.user);
    })
    .catch((error) => {
      // Don't log an error if the user closes the popup or cancels the request
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error("Authentication failed:", error);
    });
};

export const signOut = () => {
  firebaseSignOut(auth)
    .catch((error) => {
      console.error("Sign out failed:", error);
    });
};

export { app, auth, db };
