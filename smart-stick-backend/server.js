// server.js

const express = require('express');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const validateEnv = require('./utils/validateEnv');

// Load environment variables
dotenv.config();

// Validate environment variables on startup
validateEnv();

// Connect to the database
connectDB();

const app = express();
app.set('trust proxy', 1); // Trust the first proxy (Required for Render/Heroku/Vercel)
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(express.json());

// CORS Configuration:
// This restricts API access to your frontend's URL.
const allowedOrigins = [
    'http://localhost:3000',
    'https://smart-walking-stick-alpha.vercel.app', // Your new Vercel deployment
    'https://smart-walking-stick-iota.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
    origin: allowedOrigins,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Socket.io Setup
const io = new Server(server, {
    cors: corsOptions
});

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    socket.on('join', (room) => {
        if (socket.user && socket.user.stickId === room) {
            socket.join(room);
        }
    });
});

// ===================================================
// BASIC HEALTH CHECK
// ===================================================
app.get('/', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Smart Stick Backend is running.' });
});
 
// ===================================================
// ROUTES
// ===================================================

// Import Routes
const authRoutes = require('./routes/auth');
const locationRoutes = require('./routes/location');
const userRoutes = require('./routes/user');
const firmwareRoutes = require('./routes/firmware');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/firmware', firmwareRoutes);
app.use('/api', locationRoutes(io)); // Pass io instance to location routes

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});