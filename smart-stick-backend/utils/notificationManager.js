// utils/notificationManager.js

const User = require('../models/User');
const { sendEmergencyEmail } = require('./emailService');
const { sendEmergencyPushNotification } = require('./pushNotificationService');

/**
 * Orchestrates the sending of emergency notifications.
 * It finds the user associated with the stick ID and triggers both email and push notifications
 * if the user has provided the necessary details (email, FCM token).
 * This function is designed to be "fire-and-forget" to avoid blocking the main request flow.
 *
 * @async
 * @param {string} stickId - The ID of the stick that triggered the emergency.
 * @param {number} latitude - The latitude of the emergency location.
 * @param {number} longitude - The longitude of the emergency location.
 * @returns {Promise<void>} A promise that resolves when the notification logic is complete.
 */
const triggerEmergencyAlerts = async (stickId, latitude, longitude) => {
    try {
        const user = await User.findOne({ stickId });

        if (!user) {
            console.warn(`[EMERGENCY] No user found for stickId: ${stickId}. Cannot send alerts.`);
            return;
        }

        // Send email if user has an email address
        if (user.email) {
            sendEmergencyEmail(user.email, stickId, latitude, longitude);
        }

        // Send push notification if user has an FCM token
        if (user.fcmToken) {
            sendEmergencyPushNotification(user.fcmToken, stickId);
        }
    } catch (error) {
        console.error(`[EMERGENCY] Error while triggering alerts for stickId ${stickId}:`, error);
    }
};

module.exports = { triggerEmergencyAlerts };