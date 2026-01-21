import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC-PfCICskGcxxqo6Oz2XjCjgzrSCE01B4",
  authDomain: "asdfg-7d8e6.firebaseapp.com",
  databaseURL: "https://asdfg-7d8e6-default-rtdb.firebaseio.com",
  projectId: "asdfg-7d8e6",
  storageBucket: "asdfg-7d8e6.firebasestorage.app",
  messagingSenderId: "894274190704",
  appId: "1:894274190704:web:1dc4210af49dd4cfa4e3b5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);