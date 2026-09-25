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

export const setAuthToken = (token, refresh = '', role = 'citizen', isStaff = false, username = '', departmentId = null, departmentName = '') => {
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
        if (departmentId) localStorage.setItem('department_id', String(departmentId));
        if (departmentName) localStorage.setItem('department_name', departmentName);
    } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        localStorage.removeItem('role');
        localStorage.removeItem('is_staff');
        localStorage.removeItem('username');
        localStorage.removeItem('department_id');
        localStorage.removeItem('department_name');
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

export const getStoredUsername = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('username') || '';
};

export const getStoredDepartmentName = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('department_name') || '';
};

export const isAdmin = () => ['admin', 'department_admin'].includes(getUserRole());
export const isDepartmentAdmin = () => getUserRole() === 'department_admin';
export const isOfficerOrAdmin = () => ['admin', 'department_admin'].includes(getUserRole());


// Automatically attach token to every request
API.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Automatic token refresh on 401
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh') : null;
            if (refresh) {
                try {
                    const refreshRes = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
                        refresh,
                    });
                    const newToken = refreshRes.data?.access;
                    if (newToken) {
                        localStorage.setItem('token', newToken);
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return API(originalRequest);
                    }
                } catch (refreshErr) {
                    console.error('Session refresh failed:', refreshErr);
                    clearAuth();
                }
            }
        }
        return Promise.reject(error);
    }
);

// Profile endpoints
export const fetchUserProfile = async () => {
    const res = await API.get('/profile/');
    return res.data;
};

export const updateUserProfile = async (data) => {
    const res = await API.patch('/profile/', data);
    return res.data;
};

// Department endpoints
export const fetchDepartmentsOverview = async () => {
    const res = await API.get('/departments/overview/');
    return res.data;
};

export const fetchDepartmentStats = async (departmentId) => {
    const res = await API.get(`/departments/${departmentId}/stats/`);
    return res.data;
};

// AI Live Analysis endpoint
export const analyzeIssueWithAI = async ({ title, description, image, category }) => {
    try {
        const res = await API.post('/issues/ai-analyze/', {
            title,
            description,
            image,
            category,
        });
        return res.data;
    } catch (err) {
        // Resilient fallback directly to local AI service if Django API is busy or unauthenticated
        try {
            const directRes = await axios.post('http://127.0.0.1:5000/classify', {
                title: title || '',
                description: description || '',
                image: image || null,
            }, { timeout: 4000 });
            return directRes.data;
        } catch {
            throw err;
        }
    }
};

export default API;