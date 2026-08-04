import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import { clearAuth, getUserRole } from '../services/api';

function Navbar() {
    const navigate = useNavigate();
    const [userType, setUserType] = useState(() => getUserRole());

    useEffect(() => {
        const syncRole = () => setUserType(getUserRole());
        syncRole();
        window.addEventListener('authchange', syncRole);
        window.addEventListener('storage', syncRole);
        return () => {
            window.removeEventListener('authchange', syncRole);
            window.removeEventListener('storage', syncRole);
        };
    }, []);

    const handleLogout = () => {
        clearAuth();
        setTimeout(() => {
            navigate('/', { replace: true });
        }, 0);
    };

    return (
        <div className={styles.navbar}>
            <div className={styles.brand}>
                Fix<span className={styles.accent}>My</span>City — Ahmedabad
            </div>

            <div className={styles.navLinks}>
                {userType === 'citizen' && (
                    <>
                        <button
                            className={styles.navLink}
                            onClick={() => navigate('/issues')}
                        >
                            My Issues
                        </button>
                        <button
                            className={styles.navLink}
                            onClick={() => navigate('/submit-issue')}
                        >
                            Report Issue
                        </button>
                    </>
                )}

                {(userType === 'admin' || userType === 'department_admin') && (
                    <button
                        className={styles.navLink}
                        onClick={() => navigate('/admin')}
                    >
                        Dashboard
                    </button>
                )}

                <button
                    className={styles.logoutBtn}
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>
        </div>
    );
}

export default Navbar;