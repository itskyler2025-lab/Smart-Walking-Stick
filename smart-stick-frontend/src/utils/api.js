// src/utils/api.js
import axios from 'axios';
import { API_URL } from './config';

// Clean the base URL once and export it for any non-axios use cases if needed.
export const baseURL = API_URL;

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Axios Request Interceptor
 * 
 * This function will be called before every request is sent.
 * It checks if a token exists in localStorage and, if so,
 * adds the 'Authorization' header to the request.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error);
  }
);

export default api;