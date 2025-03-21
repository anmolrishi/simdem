import axios from 'axios';
import { initializeAuth } from './auth';

// Create axios instance with default config
const api = axios.create({
  withCredentials: true // Enable sending cookies with requests
});

// Initialize auth when the app starts
export const initializeApiAuth = async () => {
  try {
    const { token } = await initializeAuth();
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return token;
  } catch (error) {
    console.error('Failed to initialize API auth:', error);
    throw error;
  }
};

export default api;