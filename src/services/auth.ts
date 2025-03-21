import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const REFRESH_TOKEN_URL = 'https://eu2ccapdagl001.eastus2.cloudapp.azure.com/uam/auth/tokens/access/refresh';
const REFRESH_INTERVAL = 19 * 60 * 1000; // 19 minutes in milliseconds

interface DecodedToken {
  exp: number;
  first_name: string;
  last_name: string;
  user_id: string;
  division: string;
  department: string;
  reporting_to: string;
  sub: string;
  [key: string]: any;
}

let refreshTokenTimeout: NodeJS.Timeout;

export const refreshAccessToken = async (): Promise<string> => {
  try {
    const response = await axios.post(REFRESH_TOKEN_URL, '', {
      withCredentials: true // This ensures cookies are sent with the request
    });
    return response.data;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
};

export const setupTokenRefresh = (onRefresh: (token: string) => void) => {
  // Clear any existing refresh timeout
  if (refreshTokenTimeout) {
    clearTimeout(refreshTokenTimeout);
  }

  const refresh = async () => {
    try {
      const newToken = await refreshAccessToken();
      onRefresh(newToken);
      
      // Setup the next refresh
      refreshTokenTimeout = setTimeout(refresh, REFRESH_INTERVAL);
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Handle refresh failure (e.g., redirect to login)
    }
  };

  // Start the refresh cycle
  refreshTokenTimeout = setTimeout(refresh, REFRESH_INTERVAL);
};

export const stopTokenRefresh = () => {
  if (refreshTokenTimeout) {
    clearTimeout(refreshTokenTimeout);
  }
};

export const decodeToken = (token: string): DecodedToken => {
  return jwtDecode(token);
};

export const getUserFromToken = (token: string) => {
  const decoded = decodeToken(token);
  return {
    id: decoded.user_id,
    email: decoded.sub,
    name: `${decoded.first_name} ${decoded.last_name}`,
    division: decoded.division,
    department: decoded.department,
    reporting_to: decoded.reporting_to,
    permissions: decoded['WS-2025-1001']?.permissions || {},
    roles: decoded['WS-2025-1001']?.roles || {}
  };
};

export const initializeAuth = async () => {
  try {
    const token = await refreshAccessToken();
    return {
      token,
      user: getUserFromToken(token)
    };
  } catch (error) {
    console.error('Failed to initialize auth:', error);
    throw error;
  }
};