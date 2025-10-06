// Firebase Configuration
// Пользователь должен заменить эти значения на свои из Firebase Console

const firebaseConfig = {
  apiKey: "AIzaSyCGN93LsNnRGcqGpesVWAg8jP0m6XsQAuA",
  authDomain: "budget-ami.firebaseapp.com",
  databaseURL: "https://budget-ami-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "budget-ami",
  storageBucket: "budget-ami.firebasestorage.app",
  messagingSenderId: "976854941281",
  appId: "1:976854941281:web:f40e81033cf52d236af420"
};

// Инициализация Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;