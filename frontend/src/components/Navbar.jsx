import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        <div style={styles.navbar}>
            <div style={styles.brand}>
                Fix<span style={styles.accent}>My</span>City — Ahmedabad
            </div>

            <div style={styles.navLinks}>
                {userType === 'citizen' && (
                    <>
                        <button
                            style={styles.navLink}
                            onClick={() => navigate('/issues')}
                        >
                            My Issues
                        </button>
                        <button
                            style={styles.navLink}
                            onClick={() => navigate('/submit-issue')}
                        >
                            Report Issue
                        </button>
                    </>
                )}

                {(userType === 'admin' || userType === 'department_admin') && (
                    <button
                        style={styles.navLink}
                        onClick={() => navigate('/admin')}
                    >
                        Dashboard
                    </button>
                )}

                <button
                    style={styles.logoutBtn}
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>
        </div>
    );
}

const styles = {
    navbar: {
        background: 'white',
        padding: '16px 24px',
        boxShadow: '0 2px 12px rgba(11, 17, 32, 0.08)',
        borderRadius: '12px',
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    brand: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#0B1120',
    },
    accent: {
        color: '#00E5A0',
    },
    navLinks: {
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
    },
    navLink: {
        background: 'none',
        border: 'none',
        color: '#0B1120',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        transition: 'color 0.3s ease',
    },
    logoutBtn: {
        backgroundColor: '#F0F4FF',
        color: '#0B1120',
        padding: '10px 20px',
        border: '1px solid #D0D8F0',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '13px',
    },
};

export default Navbar;