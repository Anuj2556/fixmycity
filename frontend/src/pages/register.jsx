import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { setAuthToken } from '../services/api';
import styles from './Auth.module.css';

const getErrorMessage = (err) => {
    const data = err?.response?.data;

    if (typeof data === 'string') {
        return data;
    }

    if (data?.detail) {
        return data.detail;
    }

    if (data?.error) {
        return data.error;
    }

    if (data?.message) {
        return data.message;
    }

    if (Array.isArray(data?.non_field_errors)) {
        return data.non_field_errors.join(' ');
    }

    if (data && typeof data === 'object') {
        const messages = Object.values(data)
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
            .filter(Boolean)
            .map((value) => String(value))
            .join(' ');

        if (messages) {
            return messages;
        }
    }

    return 'Registration failed. Try again.';
};

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post('/register/', formData);
            setMessage(res.data.message || 'User created successfully');
            setMessageType('success');

            // Auto-login so the user can access protected features immediately
            try {
                const loginRes = await API.post('/login/', {
                    username: formData.username,
                    password: formData.password,
                });
                console.log('Auto-login response:', loginRes.data);
                if (loginRes.data && loginRes.data.access) {
                    const username = (formData.username || '').toLowerCase();
                    const isAdminUser = username === 'admin' || username.includes('admin');
                    const role = loginRes.data.role || loginRes.data.user?.role || (loginRes.data.user?.is_staff || loginRes.data.is_staff || isAdminUser ? 'admin' : 'citizen');
                    const isStaff = Boolean(loginRes.data.user?.is_staff || loginRes.data.is_staff || isAdminUser);
                    setAuthToken(loginRes.data.access, loginRes.data.refresh || '', role, isStaff, formData.username);
                    navigate(role === 'admin' ? '/admin' : '/issues', { replace: true });
                    return;
                } else {
                    console.error('Auto-login failed, no token:', loginRes.data);
                    setMessage('Registration succeeded. Please login.');
                    setMessageType('success');
                    navigate('/login');
                    return;
                }
                return;
            } catch (loginErr) {
                // If auto-login fails, fall back to asking user to login
                setMessage('Registration succeeded. Please login.');
                setMessageType('success');
                navigate('/login');
                return;
            }
        } catch (err) {
            setMessage(getErrorMessage(err));
            setMessageType('error');
        }
    };

    return (
        <div className={styles.body}>
            <div className={styles.container}>
                <div className={styles.headerSection}>
                    <h1 className={styles.brand}>Fix<span className={styles.brandAccent}>My</span>City</h1>
                    <p className={styles.subtitle}>Create a new account</p>
                </div>

                <div className={styles.formCard}>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Username <span className={styles.required}>*</span></label>
                            <input
                                className={styles.input}
                                type="text"
                                name="username"
                                placeholder="Choose a username"
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email <span className={styles.required}>*</span></label>
                            <input
                                className={styles.input}
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Password <span className={styles.required}>*</span></label>
                            <div className={styles.passwordContainer}>
                                <input
                                    className={styles.passwordInput}
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Create a password"
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className={styles.eyeButton}
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button className={styles.submitBtn} type="submit">
                            Register
                        </button>
                    </form>

                    {message && (
                        <div className={`${styles.message} ${messageType === 'success' ? styles.messageSuccess : styles.messageError}`}>
                            {messageType === 'success' ? '✅' : '❌'} {message}
                        </div>
                    )}

                    <p className={styles.link}>
                        Already have an account? <a href="/login" className={styles.linkAnchor}>Login</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;
