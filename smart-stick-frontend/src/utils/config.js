// src/utils/config.js

// Helper to ensure the URL doesn't have a trailing slash
const formatApiUrl = (url) => (url || '').replace(/\/+$/, '');

// Add a check to ensure the API URL is defined.
// In a development environment, this provides a clear error.
// In production (Vercel), this check helps identify missing environment variables.
if (!import.meta.env.VITE_API_URL) {
    throw new Error("FATAL: VITE_API_URL is not defined. Please check your .env file or deployment environment variables.");
}

export const API_URL = formatApiUrl(import.meta.env.VITE_API_URL);
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
export const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
export const DEFAULT_STICK_ID = import.meta.env.VITE_STICK_ID;