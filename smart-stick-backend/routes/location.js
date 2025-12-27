// routes/location.js

const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { triggerEmergencyAlerts } = require('../utils/notificationManager');

module.exports = function(io) {
    
    // POST /api/location (Secured for ESP32)
    router.post('/location', async (req, res) => {
        try {
            // 1. Security Check: Verify API Key from ESP32 headers
            const apiKey = req.header('x-api-key');
            // Ensure ESP32_API_KEY is set in your .env file
            if (!process.env.ESP32_API_KEY || apiKey !== process.env.ESP32_API_KEY) {
                return res.status(401).json({ message: 'Unauthorized: Invalid API Key' });
            }

            const { stickId, latitude, longitude, batteryLevel, isCharging, obstacleDetected, emergency } = req.body;
            
            console.log(`[DATA RECEIVED] Stick: ${stickId} | Lat: ${latitude} | Lng: ${longitude} | Bat: ${batteryLevel}% | Chg: ${isCharging}`);

            if (!stickId || latitude === undefined || longitude === undefined) { 
                return res.status(400).json({ message: 'Missing stickId, latitude, or longitude.' });
            }

            // Prepare response payload for the ESP32 and determine the final emergency state
            const responsePayload = { message: 'Location data saved successfully!' };
            let finalEmergencyState = emergency;

            // Check user record for pending commands
            const user = await User.findOne({ stickId });

            // If the device is reporting an emergency, check if the user has requested to clear it.
            if (emergency && user && user.pendingClearCommand) {
                console.log(`[EMERGENCY] Stick ${stickId} has pending clear command. Sending reset to device.`);
                finalEmergencyState = false; 
                responsePayload.command = 'clear_emergency'; 
                user.pendingClearCommand = false; // Command sent, reset flag
                await user.save();
            }

            // --- SPAM PREVENTION LOGIC ---
            // Determine if we should send a notification. We only want to alert on the *start* of an emergency
            // or if it's been a long time since the last update to avoid spamming every 10 seconds.
            let shouldTriggerAlert = false;
            if (finalEmergencyState) {
                // Fetch the most recent *saved* location (before we save the new one)
                const lastLocation = await Location.findOne({ stickId }).sort({ timestamp: -1 });

                // Trigger if:
                // 1. No previous history exists.
                // 2. The previous location was NOT an emergency (state change: False -> True).
                // 3. The previous update was over 5 minutes ago (keep-alive alert).
                if (!lastLocation || !lastLocation.emergency || (Date.now() - new Date(lastLocation.timestamp).getTime() > 5 * 60 * 1000)) {
                    shouldTriggerAlert = true;
                }
            }

            const newLocation = new Location({
                stickId,
                batteryLevel,
                isCharging,
                obstacleDetected,
                emergency: finalEmergencyState,
                location: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                }
            });
 
            await newLocation.save();
            
            // Emit real-time update
            io.to(stickId).emit('locationUpdate', newLocation);
            
            // Trigger alerts only for a new, uncleared emergency
            if (shouldTriggerAlert) {
                // This is a "fire-and-forget" call. We don't await it because the response
                // to the ESP32 should not be blocked by the notification sending process.
                triggerEmergencyAlerts(stickId, latitude, longitude);
            }

            res.status(201).json(responsePayload);

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error saving data' });
        }
    });

    // GET /api/latest (Secured)
    router.get('/latest', auth, async (req, res) => {
        try {
            const stickId = req.user.stickId;
            
            const latestLocation = await Location.findOne({ stickId })
                .sort({ timestamp: -1 })
                .limit(1);

            if (!latestLocation) {
                return res.status(404).json({ message: 'No location data found for this stick.' });
            }

            res.status(200).json(latestLocation);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error fetching latest data' });
        }
    });

    // GET /api/history (Secured)
    router.get('/history', auth, async (req, res) => {
        try {
            const stickId = req.user.stickId;
            const limit = parseInt(req.query.limit) || 200; 
            const { startDate, endDate } = req.query;

            let query = { stickId };

            // Add date range filter if provided
            if (startDate || endDate) {
                query.timestamp = {};
                if (startDate) {
                    query.timestamp.$gte = new Date(startDate);
                }
                if (endDate) {
                    const end = new Date(endDate);
                    // If only date is provided (YYYY-MM-DD), set to end of day to include all events on that day
                    if (endDate.length === 10) {
                        end.setHours(23, 59, 59, 999);
                    }
                    query.timestamp.$lte = end;
                }
            }

            const history = await Location.find(query)
                .sort({ timestamp: -1 })
                .limit(limit)
                .select('location timestamp')
                .exec(); 

            const path = history.reverse().map(doc => ({
                lat: doc.location.coordinates[1],
                lng: doc.location.coordinates[0],
                time: doc.timestamp
            }));

            res.status(200).json(path);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error fetching history' });
        }
    });

    // POST /api/emergency/clear (Secured)
    router.post('/emergency/clear', auth, async (req, res) => {
        try {
            const stickId = req.user.stickId;

            // Set the persistent flag in the database
            await User.findOneAndUpdate(
                { stickId },
                { pendingClearCommand: true }
            );
            console.log(`[EMERGENCY] Stick ${stickId} flagged for clearing in DB.`);
            
            // Update the latest DB entry to give the user immediate visual feedback
            const latestLocation = await Location.findOne({ stickId }).sort({ timestamp: -1 });
            if (latestLocation && latestLocation.emergency) {
                latestLocation.emergency = false;
                await latestLocation.save();
            }
            
            io.to(stickId).emit('emergencyCleared');

            res.status(200).json({ message: 'Emergency status cleared.' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error clearing emergency.' });
        }
    });

    return router;
};