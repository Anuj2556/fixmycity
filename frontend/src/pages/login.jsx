import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API, { setAuthToken, fetchDepartments } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
    CivicShieldIcon,
    SunIcon,
    MoonIcon,
    UserIcon,
    BuildingOfficeIcon,
    AdminBadgeIcon,
} from '../components/common/Icons';
import styles from './Auth.module.css';

const cleanMessage = (text) => {
    if (!text || typeof text !== 'string') return '';
    const lower = text.toLowerCase();
    if (lower.includes('mongo') || lower.includes('database') || lower.includes('bson') || lower.includes('buffering') || lower.includes('econnrefused')) {
        return 'We are experiencing a temporary service delay. Please try again shortly.';
    }
    if (lower.includes('e11000') || lower.includes('duplicate key')) {
        return 'This account is already registered. Please sign in instead.';
    }
    return text;
};

const getErrorMessage = (err) => {
    if (!err.response) {
        return 'Unable to reach the server. Please check your internet connection or wait a moment while the service starts up.';
    }
    const { status, data } = err.response;
    const raw = typeof data === 'string' ? data : (data?.detail || data?.error || data?.message);
    const cleaned = cleanMessage(raw);
    if (cleaned) return cleaned;

    if (status === 401) return 'Incorrect username or password. Please double-check your credentials and try again.';
    if (status === 400) return 'Please ensure all required fields are entered correctly.';
    if (status === 502 || status === 503 || status === 504) return 'The civic portal is momentarily starting up. Please give it a few seconds and try again.';
    if (status === 500) return 'Our servers are currently experiencing high traffic. Please try again in a few moments.';
    return 'Something went wrong while signing in. Please try again.';
};



function Login() {
    const { theme, toggleTheme } = useTheme();
    const [selectedRole, setSelectedRole] = useState('citizen'); // 'citizen' | 'department_admin' | 'admin'
    const [departments, setDepartments] = useState([]);
    const [selectedDeptId, setSelectedDeptId] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Load available departments on mount
    useEffect(() => {
        const loadDeptList = async () => {
            try {
                const data = await fetchDepartments();
                if (Array.isArray(data) && data.length > 0) {
                    setDepartments(data);
                    setSelectedDeptId(String(data[0].id));
                }
            } catch (err) {
                console.error('Failed to load departments in login:', err);
            }
        };
        loadDeptList();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (role) => {
        setSelectedRole(role);
        setError('');
        setFormData({ username: '', password: '' });
    };

    const handleDepartmentSelect = (deptId) => {
        setSelectedDeptId(String(deptId));
    };



    const executeLogin = async (uname, pwd) => {
        setLoading(true);
        setError('');
        try {
            let res;
            try {
                res = await API.post('/login/', { username: uname, password: pwd });
            } catch (initialErr) {
                {
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

    const activeDept = departments.find((d) => String(d.id) === String(selectedDeptId));

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
                    {/* Role Switcher Tabs */}
                    <div className={styles.roleSelectorThree}>
                        <div
                            className={`${styles.roleOption} ${selectedRole === 'citizen' ? styles.roleOptionSelected : ''}`}
                            onClick={() => handleRoleChange('citizen')}
                            role="button"
                            tabIndex={0}
                        >
                            <div className={styles.roleEmoji}><UserIcon size={18} /></div>
                            <div className={styles.roleText}>Citizen</div>
                        </div>

                        <div
                            className={`${styles.roleOption} ${selectedRole === 'department_admin' ? styles.roleOptionSelected : ''}`}
                            onClick={() => handleRoleChange('department_admin')}
                            role="button"
                            tabIndex={0}
                        >
                            <div className={styles.roleEmoji}><BuildingOfficeIcon size={18} /></div>
                            <div className={styles.roleText}>Officer</div>
                        </div>

                        <div
                            className={`${styles.roleOption} ${selectedRole === 'admin' ? styles.roleOptionSelected : ''}`}
                            onClick={() => handleRoleChange('admin')}
                            role="button"
                            tabIndex={0}
                        >
                            <div className={styles.roleEmoji}><AdminBadgeIcon size={18} /></div>
                            <div className={styles.roleText}>Admin</div>
                        </div>
                    </div>



                    {/* Department Officer Selector & Detail Card */}
                    {selectedRole === 'department_admin' && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Municipal Department <span className={styles.required}>*</span>
                            </label>
                            <select
                                className={styles.select}
                                value={selectedDeptId}
                                onChange={(e) => handleDepartmentSelect(e.target.value)}
                            >
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.icon || '🏢'} {d.name} ({d.code})
                                    </option>
                                ))}
                            </select>

                            {activeDept && (
                                <div className={styles.deptInfoCard} style={{ marginTop: '8px' }}>
                                    <div className={styles.deptInfoCardHeader}>
                                        <span>{activeDept.icon || '🏢'}</span>
                                        <span>{activeDept.name}</span>
                                    </div>
                                    <div className={styles.deptInfoCardMeta}>
                                        Lead: <strong>{activeDept.head_officer || 'Chief Municipal Officer'}</strong>
                                        <br />
                                        Hotline: {activeDept.phone} • Email: {activeDept.email}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                {selectedRole === 'department_admin' ? 'Officer Username' : 'Username'}{' '}
                                <span className={styles.required}>*</span>
                            </label>
                            <input
                                className={styles.input}
                                type="text"
                                name="username"
                                placeholder={
                                    selectedRole === 'department_admin'
                                        ? 'e.g. officer_roads, officer_water'
                                        : 'Enter your username'
                                }
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
                            {loading
                                ? 'Authenticating...'
                                : selectedRole === 'department_admin'
                                ? 'Sign In as Department Officer'
                                : selectedRole === 'admin'
                                ? 'Sign In as City Administrator'
                                : 'Sign In to Citizen Portal'}
                        </button>
                    </form>

                    {error && (
                        <div className={styles.messageError}>
                            ❌ {error}
                        </div>
                    )}

                    <p className={styles.link}>
                        {selectedRole === 'department_admin' ? (
                            <>Need an officer account? <Link to="/register" className={styles.linkAnchor}>Register Department Officer</Link></>
                        ) : (
                            <>New to FixMyCity Ahmedabad? <Link to="/register" className={styles.linkAnchor}>Create account</Link></>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;

