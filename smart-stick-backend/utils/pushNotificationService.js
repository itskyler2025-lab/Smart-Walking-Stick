// utils/pushNotificationService.js

/**
 * @file Initializes the Firebase Admin SDK for push notifications.
 * It attempts to load credentials first from the `FIREBASE_SERVICE_ACCOUNT` environment variable
 * (ideal for production), and falls back to a local `firebase-service-account.json` file
 * for development. Logs warnings if credentials are not found.
 */

const admin = require('firebase-admin');

let serviceAccount;

try {
  // In production, use the environment variable. Locally, use the file.
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.warn("[Push] Invalid JSON in FIREBASE_SERVICE_ACCOUNT env var. Falling back to local file.");
    }
  } 
  
  if (!serviceAccount) {
    // Ensure the file exists in your backend's root directory for local dev
    try {
      serviceAccount = require('../firebase-service-account.json');
    } catch (e) {
      console.warn("[Push] Local firebase-service-account.json not found.");
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    console.warn("[Push] Firebase credentials missing. Push notifications will not work.");
  }
} catch (error) {
  console.error("[Push] Failed to initialize Firebase Admin:", error);
}

/**
 * Sends a push notification for an emergency alert via Firebase Cloud Messaging (FCM).
 * Checks if Firebase Admin is initialized and if a valid FCM token is provided before sending.
 * The message is sent as a `data` payload to allow for custom handling on the client-side,
 * even when the app is in the background.
 * @async
 * @param {string} fcmToken - The FCM device registration token of the user.
 * @param {string} stickId - The ID of the stick that triggered the emergency.
 * @returns {Promise<void>} A promise that resolves when the push notification is sent or fails.
 */
const sendEmergencyPushNotification = async (fcmToken, stickId) => {
  if (admin.apps.length === 0) {
    console.error("[Push] Firebase not initialized. Skipping notification.");
    return;
  }

  if (!fcmToken) {
    console.log(`[Push] No FCM token for user of stick ${stickId}. Skipping push notification.`);
    return;
  }

  const message = {
    token: fcmToken,
    // Use `data` payload for background notifications to have full control on the client
    data: {
      title: '🚨 EMERGENCY ALERT',
      body: `Panic button pressed on Stick ${stickId}!`,
      stickId: stickId,
      type: 'emergency' // Custom type to identify the notification
    },
  };

  try {
    await admin.messaging().send(message);
    console.log(`[Push] Emergency notification sent successfully for stick ${stickId}.`);
  } catch (error) {
    console.error('[Push] Error sending push notification:', error);
  }
};

module.exports = { sendEmergencyPushNotification };