// server.js

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config');
const Location = require('./models/Location');
const User = require('./models/User');         // NEW
const bcrypt = require('bcryptjs');             // NEW
const jwt = require('jsonwebtoken');            // NEW
const auth = require('./middleware/auth');      // NEW
const cors = require('cors');                   // NEW: Needed for communication between frontend and backend

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// CORS Configuration: More secure for production
// This restricts API access to your frontend's URL.
const allowedOrigins = [
    'http://localhost:3000',
    'https://smart-walking-stick-iota.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
    origin: allowedOrigins,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// ===================================================
// BASIC HEALTH CHECK
// ===================================================
app.get('/', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Smart Stick Backend is running.' });
});
 
// ===================================================
// AUTHENTICATION ROUTES
// ===================================================

// POST /api/auth/register
// Purpose: Register a new user and link them to a stickId
app.post('/api/auth/register', async (req, res) => {
    const { username, password, stickId } = req.body;

    if (!username || !password || !stickId) {
        return res.status(400).json({ msg: 'Please enter all required fields.' });
    }

    try {
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ msg: 'User already exists.' });
        }
        
        let stickOwner = await User.findOne({ stickId });
        if (stickOwner) {
            return res.status(400).json({ msg: 'Stick ID is already registered.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ username, password: hashedPassword, stickId });
        await user.save();
        
        res.status(201).json({ msg: 'User registered successfully. Please log in.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error during registration.');
    }
});

// POST /api/auth/login
// Purpose: Authenticate user and return a JWT token
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = { 
            userId: user._id, 
            stickId: user.stickId 
        };
        
        jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }, 
            (err, token) => {
                if (err) throw err;
                res.json({ token, stickId: user.stickId });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error during login');
    }
});


// ===================================================
// DEVICE DATA ENDPOINTS (SECURED)
// ===================================================

// POST Endpoint for the Smart Stick (ESP32) - This remains unsecured as the device has no token
// Route: /api/location
app.post('/api/location', async (req, res) => {
    try {
        const { stickId, latitude, longitude, batteryLevel, obstacleDetected } = req.body;

        if (!stickId || !latitude || !longitude) {
            return res.status(400).json({ message: 'Missing stickId, latitude, or longitude.' });
        }

        const newLocation = new Location({
            stickId,
            batteryLevel,
            obstacleDetected,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude] // [longitude, latitude] for GeoJSON
            }
        });

        await newLocation.save();
        res.status(201).json({ message: 'Location data saved successfully!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error saving data' });
    }
});

// GET /api/latest (SECURED)
// Purpose: Get the single most recent location for the logged-in user's stick.
app.get('/api/latest', auth, async (req, res) => {
    try {
        const stickId = req.user.stickId; // Extracted from JWT
        
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

// GET /api/history (SECURED)
// Purpose: Get recent location history to draw the path on the map.
app.get('/api/history', auth, async (req, res) => {
    try {
        const stickId = req.user.stickId; // Extracted from JWT
        const limit = parseInt(req.query.limit) || 200; 

        const history = await Location.find({ stickId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .select('location timestamp')
            .exec(); 

        // Reverse and map to {lat, lng} for Google Maps Polyline
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});