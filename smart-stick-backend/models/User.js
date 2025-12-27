// models/User.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // Link the user to a specific walking stick
    stickId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // Personal Information
    fullName: {
        type: String,
        trim: true
    },
    birthdate: {
        type: Date
    },
    age: {
        type: Number
    },
    gender: {
        type: String
    },
    bloodType: {
        type: String
    },
    homeAddress: {
        type: String
    },
    emergencyContactName: {
        type: String
    },
    emergencyContactNumber: {
        type: String
    },
    // Medical Information
    medicalCondition: {
        type: String
    },
    // Store user's preferred timezone (e.g., 'America/New_York')
    timezone: {
        type: String,
        default: 'UTC'
    },
    // Field to store the Firebase Cloud Messaging (FCM) token for push notifications
    fcmToken: {
        type: String
    },
    // Flag to indicate if a clear command is waiting for the device
    pendingClearCommand: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

module.exports = mongoose.model('User', UserSchema);