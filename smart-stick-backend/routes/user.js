// routes/user.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET /api/user/profile
// Desc: Get current user's profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT /api/user/profile
// Desc: Update user profile
router.put('/profile', auth, async (req, res) => {
    // --- Input Validation ---
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const validGenders = ['Male', 'Female', 'Other', 'Prefer not to say'];
    const { age, gender, bloodType } = req.body;

    // Validate `age` if it exists and is not an empty string (which is used to clear the field)
    if (age !== undefined && age !== null && age !== '') {
        const ageNum = Number(age);
        if (isNaN(ageNum) || !Number.isInteger(ageNum) || ageNum < 0 || ageNum > 120) {
            return res.status(400).json({ msg: 'Please provide a valid age (a whole number between 0 and 120).' });
        }
    }

    // Validate `gender` if it exists and is not an empty string
    if (gender && !validGenders.includes(gender)) {
        return res.status(400).json({ msg: 'Invalid gender specified.' });
    }

    // Validate `bloodType` if it exists and is not an empty string
    if (bloodType && !validBloodTypes.includes(bloodType)) {
        return res.status(400).json({ msg: 'Invalid blood type specified.' });
    }

    // Build profile object from validated and provided fields.
    // This approach allows fields to be cleared by sending an empty string.
    const profileFields = {};
    const allowedFields = [
        'fullName', 'birthDate', 'age', 'gender', 'bloodType', 'homeAddress', 
        'emergencyContactName', 'emergencyContactNumber', 'medicalCondition', 'profileImage'
    ];

    allowedFields.forEach(field => {
        if (req.body.hasOwnProperty(field)) {
            profileFields[field] = req.body[field];
        }
    });

    try {
        const userExists = await User.findById(req.user.userId);
        if (!userExists) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Update the user profile
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: profileFields },
            { new: true, runValidators: true } // `new: true` returns the updated doc
        ).select('-password');

        res.json(updatedUser);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(' ') });
        }
        res.status(500).send('Server Error');
    }
});

// PUT /api/user/fcm-token
// Desc: Update user's FCM token for push notifications
router.put('/fcm-token', auth, async (req, res) => {
    const { fcmToken } = req.body;

    if (!fcmToken) {
        return res.status(400).json({ msg: 'FCM token is required.' });
    }

    try {
        await User.findByIdAndUpdate(req.user.userId, { fcmToken });
        res.json({ msg: 'FCM token updated successfully.' });
    } catch (err) {
        console.error('Error saving FCM token:', err.message);
        res.status(500).send('Server Error');
    }
});

// PUT /api/user/change-password
// Desc: Change user password
router.put('/change-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: 'Please provide both current and new passwords.' });
    }

    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (!user.password) {
            return res.status(400).json({ msg: 'Account does not have a password set.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid current password' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).send('Server Error');
    }
});

// PUT /api/user/change-email
// Desc: Change user email
router.put('/change-email', auth, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please provide new email and current password.' });
    }

    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid password' });

        user.email = email;
        await user.save();

        res.json({ msg: 'Email updated successfully', email: user.email });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
