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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

    // Close mobile menu and dropdown on page route changes
    useEffect(() => {
        setMobileMenuOpen(false);
        setDropdownOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        clearAuth();
        setDropdownOpen(false);
        setMobileMenuOpen(false);
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

    const navigateTo = (path) => {
        setMobileMenuOpen(false);
        navigate(path);
    };

    return (
        <header className={styles.header}>
            <div className={styles.navbarInner}>
                {/* Brand */}
                <div className={styles.brandWrapper} onClick={() => navigateTo('/')}>
                    <div className={styles.logoMark}>
                        <CivicShieldIcon size={20} />
                    </div>
                    <div className={styles.brandText}>
                        <span className={styles.brandTitle}>FixMyCity</span>
                        <span className={styles.brandSubtitle}>Ahmedabad</span>
                    </div>
                </div>

                {/* Desktop Nav Links */}
                <nav className={styles.navLinks}>
                    <button
                        className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}
                        onClick={() => navigateTo('/')}
                    >
                        <span>Overview</span>
                    </button>

                    {/* Citizen-only Navigation Links */}
                    {loggedIn && userType === 'citizen' && (
                        <>
                            <button
                                className={`${styles.navLink} ${isActive('/submit-issue') ? styles.navLinkActive : ''}`}
                                onClick={() => navigateTo('/submit-issue')}
                            >
                                <ReportPlusIcon size={16} />
                                <span>Report Issue</span>
                            </button>

                            <button
                                className={`${styles.navLink} ${isActive('/issues') ? styles.navLinkActive : ''}`}
                                onClick={() => navigateTo('/issues')}
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
                            onClick={() => navigateTo('/departments')}
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
                                onClick={() => navigateTo('/admin')}
                            >
                                <AdminBadgeIcon size={16} />
                                <span>Operations</span>
                            </button>
                            <button
                                className={`${styles.navLink} ${isActive('/departments') ? styles.navLinkActive : ''}`}
                                onClick={() => navigateTo('/departments')}
                            >
                                <BuildingOfficeIcon size={16} />
                                <span>Departments</span>
                                <span className={styles.amcTag}>AMC</span>
                            </button>
                        </>
                    )}
                </nav>

                {/* Right Area: Theme Toggle, User Auth, and Mobile Hamburger */}
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

                    {/* Desktop User Dropdown / Auth Group */}
                    <div className={styles.desktopUserArea} ref={dropdownRef}>
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
                                <button className={styles.signInBtn} onClick={() => navigateTo('/login')}>
                                    Sign in
                                </button>
                                <button className={styles.signUpBtn} onClick={() => navigateTo('/register')}>
                                    Get started
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Hamburger Menu Toggle Button */}
                    <button
                        type="button"
                        className={styles.mobileToggleBtn}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle mobile menu"
                    >
                        {mobileMenuOpen ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="7" x2="20" y2="7" />
                                <line x1="4" y1="12" x2="20" y2="12" />
                                <line x1="4" y1="17" x2="20" y2="17" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Slide-down Navigation Drawer */}
            {mobileMenuOpen && (
                <div className={styles.mobileMenu}>
                    {loggedIn && (
                        <div className={styles.mobileUserHeader}>
                            <div className={styles.mobileAvatar}>{getInitials(username)}</div>
                            <div className={styles.mobileUserInfo}>
                                <span className={styles.mobileUserName}>{username || 'User'}</span>
                                <span className={`${styles.mobileUserRole} ${getRoleClass()}`}>
                                    {getRoleLabel()} • AMC Portal
                                </span>
                            </div>
                        </div>
                    )}

                    <div className={styles.mobileNavLinks}>
                        <button
                            className={`${styles.mobileNavItem} ${isActive('/') ? styles.mobileNavItemActive : ''}`}
                            onClick={() => navigateTo('/')}
                        >
                            <span>Overview</span>
                        </button>

                        {loggedIn && userType === 'citizen' && (
                            <>
                                <button
                                    className={`${styles.mobileNavItem} ${isActive('/submit-issue') ? styles.mobileNavItemActive : ''}`}
                                    onClick={() => navigateTo('/submit-issue')}
                                >
                                    <ReportPlusIcon size={18} />
                                    <span>Report Civic Issue</span>
                                </button>
                                <button
                                    className={`${styles.mobileNavItem} ${isActive('/issues') ? styles.mobileNavItemActive : ''}`}
                                    onClick={() => navigateTo('/issues')}
                                >
                                    <LayersIcon size={18} />
                                    <span>My Reports</span>
                                </button>
                            </>
                        )}

                        {loggedIn && userType === 'department_admin' && (
                            <button
                                className={`${styles.mobileNavItem} ${isActive('/departments') ? styles.mobileNavItemActive : ''}`}
                                onClick={() => navigateTo('/departments')}
                            >
                                <BuildingOfficeIcon size={18} />
                                <span>Department Queue</span>
                                <span className={styles.amcTag}>AMC</span>
                            </button>
                        )}

                        {loggedIn && userType === 'admin' && (
                            <>
                                <button
                                    className={`${styles.mobileNavItem} ${isActive('/admin') ? styles.mobileNavItemActive : ''}`}
                                    onClick={() => navigateTo('/admin')}
                                >
                                    <AdminBadgeIcon size={18} />
                                    <span>Operations Central</span>
                                </button>
                                <button
                                    className={`${styles.mobileNavItem} ${isActive('/departments') ? styles.mobileNavItemActive : ''}`}
                                    onClick={() => navigateTo('/departments')}
                                >
                                    <BuildingOfficeIcon size={18} />
                                    <span>Department Overviews</span>
                                    <span className={styles.amcTag}>AMC</span>
                                </button>
                            </>
                        )}

                        {loggedIn && (
                            <button
                                className={`${styles.mobileNavItem} ${isActive('/profile') ? styles.mobileNavItemActive : ''}`}
                                onClick={() => navigateTo('/profile')}
                            >
                                <UserIcon size={18} />
                                <span>Profile & Activity</span>
                            </button>
                        )}
                    </div>

                    <div className={styles.mobileMenuFooter}>
                        {loggedIn ? (
                            <button className={styles.mobileSignOutBtn} onClick={handleLogout}>
                                Sign Out
                            </button>
                        ) : (
                            <div className={styles.mobileAuthGrid}>
                                <button className={styles.mobileSignInBtn} onClick={() => navigateTo('/login')}>
                                    Sign In
                                </button>
                                <button className={styles.mobileSignUpBtn} onClick={() => navigateTo('/register')}>
                                    Register Account
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

export default Navbar;