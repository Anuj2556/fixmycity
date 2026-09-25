import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { setAuthToken, fetchDepartmentsOverview } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { CivicShieldIcon, SunIcon, MoonIcon, UserIcon, BuildingOfficeIcon } from '../components/common/Icons';
import styles from './Auth.module.css';

const getErrorMessage = (err) => {
    const data = err?.response?.data;
    if (typeof data === 'string') return data;
    if (data?.detail) return data.detail;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    return 'Registration failed. Please check your details.';
};

function Register() {
    const { theme, toggleTheme } = useTheme();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        role: 'citizen',
        department: '',
    });
    const [departments, setDepartments] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const loadDepartments = async () => {
            try {
                const data = await fetchDepartmentsOverview();
                setDepartments(data);
                if (data.length > 0) {
                    setFormData((prev) => ({ ...prev, department: data[0].id }));
                }
            } catch (err) {
                console.error('Failed to load departments:', err);
            }
        };
        loadDepartments();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleSelect = (role) => {
        setFormData({ ...formData, role });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const payload = {
                username: formData.username,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                role: formData.role,
                department: formData.role === 'department_admin' ? formData.department : null,
            };

            const res = await API.post('/register/', payload);
            setMessage(res.data.message || 'Account created successfully! Logging you in...');
            setMessageType('success');

            // Automatic login
            try {
                const loginRes = await API.post('/login/', {
                    username: formData.username,
                    password: formData.password,
                });

                if (loginRes.data && loginRes.data.access) {
                    const user = loginRes.data.user || {};
                    const role = loginRes.data.role || user.role || formData.role;
                    const isStaff = Boolean(role === 'admin' || role === 'department_admin');

                    setAuthToken(
                        loginRes.data.access,
                        loginRes.data.refresh || '',
                        role,
                        isStaff,
                        user.username || formData.username,
                        user.department_id,
                        user.department_name
                    );

                    setTimeout(() => {
                        if (role === 'admin') {
                            navigate('/admin', { replace: true });
                        } else if (role === 'department_admin') {
                            navigate('/departments', { replace: true });
                        } else {
                            navigate('/issues', { replace: true });
                        }
                    }, 800);
                } else {
                    navigate('/login');
                }
            } catch {
                navigate('/login');
            }
        } catch (err) {
            setMessage(getErrorMessage(err));
            setMessageType('error');
        }
        setLoading(false);
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
                    <h1 className={styles.brand}>Create Citizen Account</h1>
                    <p className={styles.subtitle}>Ahmedabad Municipal Civic Intelligence Platform</p>
                </div>

                <div className={styles.formCard}>
                    {/* Role Selection */}
                    <div className={styles.roleSelector}>
                        <div
                            className={`${styles.roleOption} ${formData.role === 'citizen' ? styles.roleOptionSelected : ''}`}
                            onClick={() => handleRoleSelect('citizen')}
                        >
                            <div className={styles.roleEmoji}><UserIcon size={20} /></div>
                            <div className={styles.roleText}>Citizen Account</div>
                        </div>

                        <div
                            className={`${styles.roleOption} ${formData.role === 'department_admin' ? styles.roleOptionSelected : ''}`}
                            onClick={() => handleRoleSelect('department_admin')}
                        >
                            <div className={styles.roleEmoji}><BuildingOfficeIcon size={20} /></div>
                            <div className={styles.roleText}>Municipal Officer</div>
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
                                placeholder="Choose a username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Email Address <span className={styles.required}>*</span>
                            </label>
                            <input
                                className={styles.input}
                                type="email"
                                name="email"
                                placeholder="name@domain.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Phone Number</label>
                            <input
                                className={styles.input}
                                type="text"
                                name="phone"
                                placeholder="+91-XXXXXXXXXX"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        {formData.role === 'department_admin' && (
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    Assigned Department <span className={styles.required}>*</span>
                                </label>
                                <select
                                    className={styles.select}
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    required
                                >
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name} ({d.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Password <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.passwordContainer}>
                                <input
                                    className={styles.passwordInput}
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Choose a strong password"
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
                            {loading ? 'Creating Account...' : 'Complete Registration'}
                        </button>
                    </form>

                    {message && (
                        <div className={messageType === 'success' ? styles.messageSuccess : styles.messageError}>
                            {messageType === 'success' ? '✅' : '❌'} {message}
                        </div>
                    )}

                    <p className={styles.link}>
                        Already registered? <a href="/login" className={styles.linkAnchor}>Sign in here</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;

