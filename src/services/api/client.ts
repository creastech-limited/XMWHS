import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 50000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
   
    if (error.response?.status === 401) {
      
      console.error('Unauthorized request - token may be invalid');
    }
    return Promise.reject(error);
  }
);