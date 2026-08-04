import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../pages/Home.module.css';
import { clearAuth, isAuthenticated } from '../../services/api';

function Nav() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(() => isAuthenticated());

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

  const handleLogout = () => {
    clearAuth();
    setIsLoggedIn(false);
    navigate('/', { replace: true });
  };

  return (
    <header className={styles.header}>
      <div className={`${styles.container} ${styles.headerInner}`}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoIcon} />
          <span className={styles.logoText}>
            Fix<span>My</span>City — Ahmedabad
          </span>
        </a>
        <nav className={styles.navLinks}>
          <a href="#features">Features</a>
          <a href="#stats">Impact</a>
        </nav>
        <div className={styles.authButtons}>
          {isLoggedIn ? (
            <>
              <button type="button" className={styles.btnOutline} onClick={() => navigate('/issues')}>
                My Issues
              </button>
              <button type="button" className={styles.btnPrimary} onClick={() => navigate('/submit-issue')}>
                Report Issue
              </button>
              <button type="button" className={styles.btnOutline} onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <a href="/login" className={styles.btnOutline}>
                Login
              </a>
              <a href="/register" className={styles.btnPrimary}>
                Register
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Nav;
