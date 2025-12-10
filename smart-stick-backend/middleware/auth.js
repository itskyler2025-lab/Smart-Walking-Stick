// middleware/auth.js

const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Get token from header (Client sends it as: Authorization: Bearer <token>)
    const tokenHeader = req.header('Authorization');

    // Check if no token header exists
    if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Extract the token part
    const token = tokenHeader.split(' ')[1]; 
    
    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the decoded user payload (userId and stickId) to the request object
        req.user = decoded; 
        
        next(); // Proceed to the next middleware/route handler
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};