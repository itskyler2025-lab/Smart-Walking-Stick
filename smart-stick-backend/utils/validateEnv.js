// utils/validateEnv.js

/**
 * Validates that all required environment variables are present on application startup.
 * If any required variable is missing from `process.env`, it logs a fatal error
 * to the console with a list of the missing variables and terminates the process.
 * @returns {void}
 */
function validateEnv() {
    const requiredEnvVars = [
        'PORT',
        'MONGO_URI',
        'JWT_SECRET',
        'JWT_EXPIRES_IN',
        'EMAIL_USER',
        'EMAIL_PASS',
        'ESP32_API_KEY',
        'FRONTEND_URL'
        // FIREBASE_SERVICE_ACCOUNT is optional for push notifications, so not strictly required here.
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error('FATAL ERROR: Missing required environment variables:');
        missingVars.forEach(varName => console.error(`- ${varName}`));
        console.error('Please check your .env file and ensure all required variables are set.');
        process.exit(1);
    }

    console.log('Environment variables validated successfully.');
}

module.exports = validateEnv;