import axios from 'axios';

const api = axios.create({
  baseURL: 'https://user-management-dashboard-1-v4xj.onrender.com/api',
  withCredentials: true, // Only needed if your backend uses cookies for auth
});

export default api;
