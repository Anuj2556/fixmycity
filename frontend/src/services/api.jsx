import axios from 'axios';

const API = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
});

export const getStoredToken = () => {
    if (typeof window === 'undefined') {
        return null;
    }
    return localStorage.getItem('token');
};

export const isAuthenticated = () => Boolean(getStoredToken());

export const setAuthToken = (token, refresh = '', role = 'citizen', isStaff = false, username = '') => {
    if (typeof window === 'undefined') {
        return;
    }
    if (token) {
        const normalizedRole = ['admin', 'department_admin'].includes(role)
            ? role
            : (isStaff || /admin/i.test(username) ? 'admin' : 'citizen');
        localStorage.setItem('token', token);
        localStorage.setItem('refresh', refresh);
        localStorage.setItem('role', normalizedRole);
        localStorage.setItem('is_staff', String(Boolean(isStaff)));
        localStorage.setItem('username', username);
    } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        localStorage.removeItem('role');
        localStorage.removeItem('is_staff');
        localStorage.removeItem('username');
    }
    window.dispatchEvent(new Event('authchange'));
};

export const clearAuth = () => {
    setAuthToken(null, '');
};

export const getUserRole = () => {
    if (typeof window === 'undefined') {
        return 'citizen';
    }
    const storedRole = localStorage.getItem('role');
    if (storedRole) {
        return storedRole;
    }
    const isStaff = localStorage.getItem('is_staff') === 'true';
    const username = (localStorage.getItem('username') || '').toLowerCase();
    const fallback = isStaff || username === 'admin' || username.includes('admin');
    return fallback ? 'admin' : 'citizen';
};

export const isAdmin = () => ['admin', 'department_admin'].includes(getUserRole());

// Automatically attach token to every request
API.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;