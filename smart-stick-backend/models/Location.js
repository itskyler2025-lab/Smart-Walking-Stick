// models/Location.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- 1. Define the Schema ---
const LocationSchema = new Schema({
    // Stick Identifier (Crucial for tracking a specific device)
    stickId: {
        type: String,
        required: true,
        trim: true,
        index: true // Index this for quick lookups
    },
    // Real-time data from sensors
    batteryLevel: {
        type: Number, // Percentage 0 to 100
        required: false,
        min: 0,
        max: 100
    },
    obstacleDetected: {
        type: Boolean,
        default: false
    },
    // Location Data (Stored as GeoJSON Point)
    location: {
        type: {
            type: String,
            enum: ['Point'], // GeoJSON type must be 'Point'
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude] - REQUIRED ORDER for GeoJSON
            required: true
        }
    },
    // Timestamp for when the data was recorded on the ESP32
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    }
}, { timestamps: true }); // Mongoose adds createdAt/updatedAt fields

// --- 2. Create the Geospatial Index ---
// This is critical for Google Maps compatibility and geospatial queries.
// It allows for efficient distance calculations and geo-based searches.
LocationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Location', LocationSchema);