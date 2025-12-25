// src/utils/firebase.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig, VAPID_KEY } from '../firebaseConfig';
import api from './api';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Get the token
      // IMPORTANT: Go to Firebase Console > Project Settings > Cloud Messaging > Web configuration.
      // Generate a "VAPID key" pair and set it as VITE_FIREBASE_VAPID_KEY in your .env file.
      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });

      if (currentToken) {
        console.log('FCM Token:', currentToken);
        // Send the token to your server
        await api.put('/api/user/fcm-token', { fcmToken: currentToken });
        console.log('FCM token sent to server successfully.');
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } else {
      console.log('Unable to get permission to notify.');
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
  }
};

// Handle foreground messages (when the app is the active tab)
onMessage(messaging, (payload) => {
  console.log('Message received in foreground. ', payload);
  // Here you could show a custom in-app notification/toast instead of a system one.
  alert(`[Foreground] ${payload.data.title}: ${payload.data.body}`);
});