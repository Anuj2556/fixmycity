import React, { useState } from 'react';
import API from '../services/api';

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
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
            setMessage(res.data.message);
            setMessageType('success');
        } catch (err) {
            setMessage('Registration failed. Try again.');
            setMessageType('error');
        }
    };

    return (
        <div style={styles.body}>
            <div style={styles.container}>
                <div style={styles.headerSection}>
                    <h1 style={styles.brand}>Fix<span style={styles.brandAccent}>My</span>City</h1>
                    <p style={styles.subtitle}>Create a new account</p>
                </div>

                <div style={styles.formCard}>
                    <form onSubmit={handleSubmit}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Username <span style={styles.required}>*</span></label>
                            <input
                                style={styles.input}
                                type="text"
                                name="username"
                                placeholder="Choose a username"
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Email <span style={styles.required}>*</span></label>
                            <input
                                style={styles.input}
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Password <span style={styles.required}>*</span></label>
                            <div style={styles.passwordContainer}>
                                <input
                                    style={styles.passwordInput}
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Create a password"
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    style={styles.eyeButton}
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button style={styles.submitBtn} type="submit">
                            Register
                        </button>
                    </form>

                    {message && (
                        <div style={{
                            ...styles.message,
                            ...(messageType === 'success' ? styles.messageSuccess : styles.messageError),
                        }}>
                            {messageType === 'success' ? '✅' : '❌'} {message}
                        </div>
                    )}

                    <p style={styles.link}>
                        Already have an account? <a href="/login" style={styles.linkAnchor}>Login</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

const styles = {
    body: {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: '#F5F9FF',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
    },
    container: {
        maxWidth: '440px',
        width: '100%',
    },
    headerSection: {
        textAlign: 'center',
        marginBottom: '32px',
    },
    brand: {
        fontSize: '32px',
        color: '#0B1120',
        marginBottom: '8px',
        fontWeight: '700',
    },
    brandAccent: {
        color: '#00E5A0',
    },
    subtitle: {
        color: '#8A9BBE',
        fontSize: '14px',
        marginTop: '4px',
    },
    formCard: {
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(11, 17, 32, 0.08)',
        border: '1px solid #F0F4FF',
    },
    formGroup: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        marginBottom: '10px',
        fontWeight: '600',
        color: '#0B1120',
        fontSize: '14px',
    },
    required: {
        color: '#FF6B6B',
        marginLeft: '4px',
    },
    input: {
        width: '100%',
        padding: '14px 16px',
        border: '1.5px solid #E8ECFF',
        borderRadius: '10px',
        fontSize: '14px',
        fontFamily: 'inherit',
        backgroundColor: '#FAFBFF',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
    },
    passwordContainer: {
        position: 'relative',
        width: '100%',
    },
    passwordInput: {
        width: '100%',
        padding: '14px 16px',
        paddingRight: '48px',
        border: '1.5px solid #E8ECFF',
        borderRadius: '10px',
        fontSize: '14px',
        fontFamily: 'inherit',
        backgroundColor: '#FAFBFF',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
    },
    eyeButton: {
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '18px',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtn: {
        width: '100%',
        padding: '14px 20px',
        background: 'linear-gradient(135deg, #00E5A0 0%, #00B87A 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginTop: '8px',
        boxShadow: '0 4px 12px rgba(0, 229, 160, 0.3)',
    },
    message: {
        marginTop: '20px',
        padding: '14px 18px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '500',
    },
    messageSuccess: {
        backgroundColor: '#E7F9F4',
        color: '#00B87A',
        borderLeft: '4px solid #00E5A0',
    },
    messageError: {
        backgroundColor: '#FFE7E7',
        color: '#FF6B6B',
        borderLeft: '4px solid #FF6B6B',
    },
    link: {
        textAlign: 'center',
        marginTop: '20px',
        fontSize: '14px',
        color: '#8A9BBE',
    },
    linkAnchor: {
        color: '#00B87A',
        fontWeight: '600',
        textDecoration: 'none',
    },
};

export default Register;