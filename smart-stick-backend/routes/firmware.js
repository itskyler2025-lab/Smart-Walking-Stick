// routes/firmware.js

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Define the latest firmware version available on the server.
// IMPORTANT: When you have a new firmware version, update this string.
const LATEST_FIRMWARE_VERSION = "1.0.0"; // Example: "1.0.1"

// The path to your compiled firmware binary.
// For this to work, you must place your 'firmware.bin' file in a 'firmware' folder in the backend root.
const FIRMWARE_PATH = path.join(__dirname, '..', 'firmware', 'firmware.bin');

// GET /api/firmware/update
router.get('/update', (req, res) => {
    // 1. Security Check: Verify API Key from ESP32 headers
    const apiKey = req.header('Authorization'); // httpUpdate sends it as the 'Authorization' header
    if (!process.env.ESP32_API_KEY || apiKey !== process.env.ESP32_API_KEY) {
        return res.status(401).json({ message: 'Unauthorized: Invalid API Key' });
    }

    // 2. Version Check: The ESP32 sends its version in this header
    const deviceVersion = req.header('x-ESP32-version');
    console.log(`[OTA] Device version: ${deviceVersion}, Server version: ${LATEST_FIRMWARE_VERSION}`);

    // 3. Compare versions
    if (deviceVersion === LATEST_FIRMWARE_VERSION) {
        // No update needed, send 304 Not Modified
        return res.status(304).send('No updates available.');
    }

    // 4. Send the new firmware file if it exists
    if (fs.existsSync(FIRMWARE_PATH)) {
        console.log('[OTA] Sending new firmware update...');
        res.sendFile(FIRMWARE_PATH);
    } else {
        res.status(404).send('Firmware file not found on server.');
    }
});

module.exports = router;