import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import { clearAuth, getUserRole, getStoredUsername, isAuthenticated } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
    CivicShieldIcon,
    ReportPlusIcon,
    LayersIcon,
    BuildingOfficeIcon,
    AdminBadgeIcon,
    SunIcon,
    MoonIcon,
    UserIcon,
} from './common/Icons';

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [userType, setUserType] = useState(() => getUserRole());
    const [username, setUsername] = useState(() => getStoredUsername());
    const [loggedIn, setLoggedIn] = useState(() => isAuthenticated());
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const syncAuth = () => {
            setUserType(getUserRole());
            setUsername(getStoredUsername());
            setLoggedIn(isAuthenticated());
        };

        syncAuth();
        window.addEventListener('authchange', syncAuth);
        window.addEventListener('storage', syncAuth);

        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('authchange', syncAuth);
            window.removeEventListener('storage', syncAuth);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        clearAuth();
        setDropdownOpen(false);
        navigate('/', { replace: true });
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.slice(0, 2).toUpperCase();
    };

    const getRoleLabel = () => {
        if (userType === 'admin') return 'Admin';
        if (userType === 'department_admin') return 'Officer';
        return 'Citizen';
    };

    const getRoleClass = () => {
        if (userType === 'admin') return styles.roleAdmin;
        if (userType === 'department_admin') return styles.roleDept;
        return styles.roleCitizen;
    };

    const isActive = (path) => location.pathname === path;

    return (
        <header className={styles.header}>
            <div className={styles.navbarInner}>
                {/* Brand */}
                <div className={styles.brandWrapper} onClick={() => navigate('/')}>
                    <div className={styles.logoMark}>
                        <CivicShieldIcon size={20} />
                    </div>
                    <div className={styles.brandText}>
                        <span className={styles.brandTitle}>FixMyCity</span>
                        <span className={styles.brandSubtitle}>Ahmedabad</span>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className={styles.navLinks}>
                    <button
                        className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}
                        onClick={() => navigate('/')}
                    >
                        Overview
                    </button>

                    {/* Citizen-only Navigation Links */}
                    {loggedIn && userType === 'citizen' && (
                        <>
                            <button
                                className={`${styles.navLink} ${isActive('/submit-issue') ? styles.navLinkActive : ''}`}
                                onClick={() => navigate('/submit-issue')}
                            >
                                <ReportPlusIcon size={16} />
                                <span>Report Issue</span>
                            </button>

                            <button
                                className={`${styles.navLink} ${isActive('/issues') ? styles.navLinkActive : ''}`}
                                onClick={() => navigate('/issues')}
                            >
                                <LayersIcon size={16} />
                                <span>My Reports</span>
                            </button>
                        </>
                    )}

                    {/* Department Officer-only Navigation Links */}
                    {loggedIn && userType === 'department_admin' && (
                        <button
                            className={`${styles.navLink} ${isActive('/departments') ? styles.navLinkActive : ''}`}
                            onClick={() => navigate('/departments')}
                        >
                            <BuildingOfficeIcon size={16} />
                            <span>Department Portal</span>
                            <span className={styles.amcTag}>AMC</span>
                        </button>
                    )}

                    {/* City Administrator Navigation Links */}
                    {loggedIn && userType === 'admin' && (
                        <>
                            <button
                                className={`${styles.navLink} ${isActive('/admin') ? styles.navLinkActive : ''}`}
                                onClick={() => navigate('/admin')}
                            >
                                <AdminBadgeIcon size={16} />
                                <span>Operations</span>
                            </button>
                            <button
                                className={`${styles.navLink} ${isActive('/departments') ? styles.navLinkActive : ''}`}
                                onClick={() => navigate('/departments')}
                            >
                                <BuildingOfficeIcon size={16} />
                                <span>Departments</span>
                                <span className={styles.amcTag}>AMC</span>
                            </button>
                        </>
                    )}
                </nav>

                {/* Right Area: Theme Toggle & User Auth */}
                <div className={styles.rightSection}>
                    <button
                        type="button"
                        id="theme-toggle-btn"
                        className={styles.themeToggle}
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
                    </button>

                    <div className={styles.userArea} ref={dropdownRef}>
                        {loggedIn ? (
                            <>
                                <button
                                    className={styles.userButton}
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    title="User account"
                                >
                                    <div className={styles.avatar}>{getInitials(username)}</div>
                                    <div className={styles.userInfo}>
                                        <span className={styles.userName}>{username || 'User'}</span>
                                        <span className={`${styles.userRole} ${getRoleClass()}`}>
                                            {getRoleLabel()}
                                        </span>
                                    </div>
                                </button>

                                {dropdownOpen && (
                                    <div className={styles.dropdown}>
                                        <div className={styles.dropdownHeader}>
                                            <div className={styles.dropdownName}>{username}</div>
                                            <div className={styles.dropdownMeta}>{getRoleLabel()} • AMC Portal</div>
                                        </div>

                                        <button
                                            className={styles.dropdownItem}
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                navigate('/profile');
                                            }}
                                        >
                                            <UserIcon size={16} />
                                            <span>Profile & Activity</span>
                                        </button>

                                        {/* Citizen dropdown actions */}
                                        {userType === 'citizen' && (
                                            <button
                                                className={styles.dropdownItem}
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                    navigate('/issues');
                                                }}
                                            >
                                                <LayersIcon size={16} />
                                                <span>My Reported Issues</span>
                                            </button>
                                        )}

                                        {/* Department Officer dropdown actions */}
                                        {userType === 'department_admin' && (
                                            <button
                                                className={styles.dropdownItem}
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                    navigate('/departments');
                                                }}
                                            >
                                                <BuildingOfficeIcon size={16} />
                                                <span>Department Queue</span>
                                            </button>
                                        )}

                                        {/* City Admin dropdown actions */}
                                        {userType === 'admin' && (
                                            <>
                                                <button
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        setDropdownOpen(false);
                                                        navigate('/admin');
                                                    }}
                                                >
                                                    <AdminBadgeIcon size={16} />
                                                    <span>Operations Central</span>
                                                </button>
                                                <button
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        setDropdownOpen(false);
                                                        navigate('/departments');
                                                    }}
                                                >
                                                    <BuildingOfficeIcon size={16} />
                                                    <span>Department Overviews</span>
                                                </button>
                                            </>
                                        )}


                                        <div className={styles.dropdownDivider} />

                                        <button
                                            className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                                            onClick={handleLogout}
                                        >
                                            <span>Sign out</span>
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className={styles.authGroup}>
                                <button className={styles.signInBtn} onClick={() => navigate('/login')}>
                                    Sign in
                                </button>
                                <button className={styles.signUpBtn} onClick={() => navigate('/register')}>
                                    Get started
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Navbar;