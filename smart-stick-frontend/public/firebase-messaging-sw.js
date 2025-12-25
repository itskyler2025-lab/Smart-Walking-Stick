// public/firebase-messaging-sw.js

// This file MUST be in the public folder.

// Import the Firebase scripts that are needed in the service worker
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// =========================================================================================
// CRITICAL: YOU MUST REPLACE THESE PLACEHOLDER VALUES WITH YOUR ACTUAL FIREBASE CONFIG
// =========================================================================================
// This service worker file runs in the browser and cannot access environment variables.
// You must manually copy the configuration values from your Firebase project settings here.
// These values are public and are safe to be included in this file.
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_FIREBASE_APP_ID"
};

// Initialize the Firebase app in the service worker
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.data.title;
  const notificationOptions = {
    body: payload.data.body,
    icon: '/logo192.png', // Or your preferred icon
    badge: '/logo192.png',
    vibrate: [200, 100, 200] // Vibrate pattern
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});