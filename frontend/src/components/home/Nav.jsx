import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import styles from '../../pages/Home.module.css';
import { clearAuth, isAuthenticated } from '../../services/api';

function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(() => isAuthenticated());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const syncAuthState = () => setIsLoggedIn(isAuthenticated());
    syncAuthState();
    window.addEventListener('storage', syncAuthState);
    window.addEventListener('authchange', syncAuthState);
    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener('authchange', syncAuthState);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuth();
    setIsLoggedIn(false);
    setMobileMenuOpen(false);
    navigate('/', { replace: true });
  };

  const navigateTo = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <header className={styles.header}>
      <div className={`${styles.container} ${styles.headerInner}`}>
        <Link to="/" className={styles.logo} onClick={() => setMobileMenuOpen(false)}>
          <span className={styles.logoIcon}>🏛️</span>
          <span className={styles.logoText}>
            Fix<span>My</span>City — Ahmedabad
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className={styles.navLinks}>
          <a href="#features">Features</a>
          <a href="#stats">Impact</a>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className={styles.desktopAuthButtons}>
          {isLoggedIn ? (
            <>
              <button type="button" className={styles.btnOutline} onClick={() => navigateTo('/issues')}>
                My Issues
              </button>
              <button type="button" className={styles.btnPrimary} onClick={() => navigateTo('/submit-issue')}>
                Report Issue
              </button>
              <button type="button" className={styles.btnOutline} onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.btnOutline}>
                Login
              </Link>
              <Link to="/register" className={styles.btnPrimary}>
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className={styles.mobileNavToggle}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
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

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className={styles.mobileHomeMenu}>
          <div className={styles.mobileHomeLinks}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>
              ✨ Platform Features
            </a>
            <a href="#stats" onClick={() => setMobileMenuOpen(false)}>
              📈 Civic Impact & Stats
            </a>
          </div>

          <div className={styles.mobileHomeActions}>
            {isLoggedIn ? (
              <>
                <button type="button" className={styles.btnPrimary} onClick={() => navigateTo('/submit-issue')}>
                  + Report Civic Issue
                </button>
                <button type="button" className={styles.btnOutline} onClick={() => navigateTo('/issues')}>
                  📋 View My Issues
                </button>
                <button type="button" className={styles.mobileSignOutBtn} onClick={handleLogout}>
                  Sign Out
                </button>
              </>
            ) : (
              <div className={styles.mobileAuthRow}>
                <Link to="/login" className={styles.btnOutline} onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/register" className={styles.btnPrimary} onClick={() => setMobileMenuOpen(false)}>
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Nav;
