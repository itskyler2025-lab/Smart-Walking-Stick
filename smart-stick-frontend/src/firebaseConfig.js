// src/firebaseConfig.js

// This file is safe to commit. It reads environment variables.
// Ensure you have a .env file in your root with the VITE_FIREBASE_* variables.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Also export the VAPID key from environment variables
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Check that all variables are present during development
for (const key in firebaseConfig) {
  if (!firebaseConfig[key]) {
    console.error(`FATAL: Missing Firebase environment variable for: ${key}. Please check your .env file or Vercel environment variables.`);
  }
}
if (!VAPID_KEY) {
  console.error("FATAL: Missing VITE_FIREBASE_VAPID_KEY. Please check your .env file or Vercel environment variables.");
}