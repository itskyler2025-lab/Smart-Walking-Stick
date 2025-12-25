// public/firebase-messaging-sw.js

// This file MUST be in the public folder.

// Import the Firebase scripts that are needed in the service worker
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// IMPORTANT:
// You must copy your Firebase config from `src/firebaseConfig.js` here.
// Environment variables are not available in the service worker, so this is a required duplication.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
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