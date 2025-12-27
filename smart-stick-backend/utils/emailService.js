// utils/emailService.js

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * Nodemailer transporter configured for Gmail.
 * Uses credentials from environment variables (EMAIL_USER, EMAIL_PASS).
 * @type {import('nodemailer').Transporter}
 */
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000 // 10 seconds
});

// Cache the email template in memory at startup to avoid blocking file I/O during requests
let emailTemplateCache = '';
try {
    emailTemplateCache = fs.readFileSync(path.join(__dirname, 'templates', 'emergencyEmail.html'), 'utf-8');
} catch (err) {
    console.error('FATAL: Could not load emergency email template:', err);
}

/**
 * Sends a formatted emergency alert email to a specified recipient.
 * It reads an HTML template, populates it with incident details, and sends it using Nodemailer.
 * @async
 * @param {string} toEmail - The recipient's email address.
 * @param {string} stickId - The ID of the smart stick that triggered the alert.
 * @param {number} lat - The latitude of the incident location.
 * @param {number} lng - The longitude of the incident location.
 * @param {string} [timezone='UTC'] - The user's preferred timezone.
 * @returns {Promise<void>} A promise that resolves when the email is sent or fails.
 */
const sendEmergencyEmail = async (toEmail, stickId, lat, lng, timezone = 'UTC') => {
    const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
    
    // Format the time using the user's timezone
    const time = new Date().toLocaleString('en-US', { 
        timeZone: timezone,
        dateStyle: 'medium',
        timeStyle: 'long'
    });

    // Use cached template
    let htmlTemplate = emailTemplateCache;

    // Replace placeholders with actual data
    htmlTemplate = htmlTemplate.replace(/{{stickId}}/g, stickId)
                               .replace('{{time}}', time)
                               .replace('{{lat}}', lat)
                               .replace('{{lng}}', lng)
                               .replace('{{mapLink}}', mapLink);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: `🚨 EMERGENCY ALERT: Smart Stick ${stickId}`,
        html: htmlTemplate
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Emergency email sent to ${toEmail}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = { sendEmergencyEmail, transporter };