// models/Location.js

const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
    stickId: {
        type: String,
        required: true,
        index: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    batteryLevel: {
        type: Number
    },
    isCharging: {
        type: Boolean,
        default: false
    },
    obstacleDetected: {
        type: Boolean,
        default: false
    },
    emergency: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Create a geospatial index for location queries
LocationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Location', LocationSchema);