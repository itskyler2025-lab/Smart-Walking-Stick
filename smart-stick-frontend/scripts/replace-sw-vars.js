// scripts/replace-sw-vars.js
const replace = require('replace-in-file');
const path = require('path');

// Load .env file for local builds
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const swFilePath = path.resolve(__dirname, '..', 'public', 'firebase-messaging-sw.js');

console.log('Running replacement script for service worker...');

const replacements = {
    'REPLACE_WITH_YOUR_FIREBASE_API_KEY': process.env.VITE_FIREBASE_API_KEY,
    'REPLACE_WITH_YOUR_FIREBASE_AUTH_DOMAIN': process.env.VITE_FIREBASE_AUTH_DOMAIN,
    'REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID': process.env.VITE_FIREBASE_PROJECT_ID,
    'REPLACE_WITH_YOUR_FIREBASE_STORAGE_BUCKET': process.env.VITE_FIREBASE_STORAGE_BUCKET,
    'REPLACE_WITH_YOUR_FIREBASE_MESSAGING_SENDER_ID': process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    'REPLACE_WITH_YOUR_FIREBASE_APP_ID': process.env.VITE_FIREBASE_APP_ID,
};

// Check if all environment variables are present
const missingVars = Object.keys(replacements).filter(key => !replacements[key]);

if (missingVars.length > 0) {
    console.error('FATAL ERROR: Missing environment variables for service worker build:');
    missingVars.forEach(key => console.error(`- VITE_${key.replace('REPLACE_WITH_YOUR_', '')}`));
    console.error('Please ensure they are set in your .env file or Vercel environment variables.');
    process.exit(1);
}

try {
    const results = replace.sync({
        files: swFilePath,
        from: Object.keys(replacements).map(key => new RegExp(key, 'g')),
        to: Object.values(replacements),
    });
    console.log('Service worker environment variables replaced successfully.');
} catch (error) {
    console.error('Error replacing variables in service worker:', error);
    process.exit(1);
}