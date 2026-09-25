import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { setAuthToken } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { CivicShieldIcon, SunIcon, MoonIcon } from '../components/common/Icons';
import styles from './Auth.module.css';

const getErrorMessage = (err) => {
    const data = err?.response?.data;
    if (typeof data === 'string') return data;
    if (data?.detail) return data.detail;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    return 'Invalid username or password.';
};

function Login() {
    const { theme, toggleTheme } = useTheme();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleQuickLogin = (uname, pwd, fallbackPwd) => {
        setFormData({ username: uname, password: pwd });
        executeLogin(uname, pwd, fallbackPwd);
    };

    const executeLogin = async (uname, pwd, fallbackPwd) => {
        setLoading(true);
        setError('');
        try {
            let res;
            try {
                res = await API.post('/login/', { username: uname, password: pwd });
            } catch (initialErr) {
                if (fallbackPwd && initialErr?.response?.status === 401) {
                    setFormData({ username: uname, password: fallbackPwd });
                    res = await API.post('/login/', { username: uname, password: fallbackPwd });
                } else {
                    throw initialErr;
                }
            }

            if (res.data && res.data.access) {
                const user = res.data.user || {};
                const role = res.data.role || user.role || 'citizen';
                const isStaff = Boolean(user.is_staff || role === 'admin' || role === 'department_admin');
                
                setAuthToken(
                    res.data.access,
                    res.data.refresh || '',
                    role,
                    isStaff,
                    user.username || uname,
                    user.department_id,
                    user.department_name
                );

                if (role === 'admin') {
                    navigate('/admin', { replace: true });
                } else if (role === 'department_admin') {
                    navigate('/departments', { replace: true });
                } else {
                    navigate('/issues', { replace: true });
                }
            } else {
                setError('Login failed: Token not received from server.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(getErrorMessage(err));
        }
        setLoading(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        executeLogin(formData.username, formData.password);
    };

    return (
        <div className={styles.body}>
            <div className={styles.authTopBar}>
                <button
                    type="button"
                    className={styles.backLink}
                    onClick={() => navigate('/')}
                >
                    ← Back to city portal
                </button>
                <button
                    type="button"
                    className={styles.themeBtn}
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                >
                    {theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />}
                    <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
            </div>

            <div className={styles.container}>
                <div className={styles.headerSection}>
                    <div className={styles.logoBadge}>
                        <CivicShieldIcon size={24} />
                    </div>
                    <h1 className={styles.brand}>FixMyCity</h1>
                    <p className={styles.subtitle}>Ahmedabad Municipal Civic Portal</p>
                </div>

                <div className={styles.formCard}>
                    {/* Quick Demo Logins for Testing */}
                    <div className={styles.demoSection}>
                        <div className={styles.demoLabel}>
                            <span>Instant Access Logins</span>
                            <span className={styles.demoBadge}>AMC VERIFIED</span>
                        </div>
                        <div className={styles.demoButtons}>
                            <button
                                type="button"
                                className={styles.demoBtn}
                                onClick={() => handleQuickLogin('citizen1', 'password123', 'citizenpass123')}
                            >
                                Citizen
                            </button>
                            <button
                                type="button"
                                className={styles.demoBtn}
                                onClick={() => handleQuickLogin('officer_roads', 'officerpass123', 'password123')}
                            >
                                Roads Dept
                            </button>
                            <button
                                type="button"
                                className={styles.demoBtn}
                                onClick={() => handleQuickLogin('adminuser', 'adminpass123', 'password123')}
                            >
                                City Admin
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Username <span className={styles.required}>*</span>
                            </label>
                            <input
                                className={styles.input}
                                type="text"
                                name="username"
                                placeholder="Enter your username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Password <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.passwordContainer}>
                                <input
                                    className={styles.passwordInput}
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
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

                        <button className={styles.submitBtn} type="submit" disabled={loading}>
                            {loading ? 'Authenticating...' : 'Sign In to Portal'}
                        </button>
                    </form>

                    {error && (
                        <div className={styles.messageError}>
                            ❌ {error}
                        </div>
                    )}

                    <p className={styles.link}>
                        New to FixMyCity Ahmedabad? <a href="/register" className={styles.linkAnchor}>Create account</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;

