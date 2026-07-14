import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

function Login() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post('/login/', formData);
            localStorage.setItem('token', res.data.access);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid username or password.');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>FixMyCity</h2>
                <p style={styles.subtitle}>Login to your account</p>
                <form onSubmit={handleSubmit}>
                    <input
                        style={styles.input}
                        type="text"
                        name="username"
                        placeholder="Username"
                        onChange={handleChange}
                        required
                    />
                    <input
                        style={styles.input}
                        type="password"
                        name="password"
                        placeholder="Password"
                        onChange={handleChange}
                        required
                    />
                    <button style={styles.button} type="submit">
                        Login
                    </button>
                </form>
                {error && <p style={styles.error}>{error}</p>}
                <p style={styles.link}>
                    New user? <a href="/register">Register here</a>
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0B1120',
    },
    card: {
        backgroundColor: '#1A2540',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        width: '360px',
    },
    title: {
        textAlign: 'center',
        marginBottom: '8px',
        color: '#00E5A0',
        fontSize: '28px',
    },
    subtitle: {
        textAlign: 'center',
        color: '#8A9BBE',
        marginBottom: '24px',
        fontSize: '14px',
    },
    input: {
        width: '100%',
        padding: '12px',
        marginBottom: '16px',
        borderRadius: '8px',
        border: '1px solid #2A3A60',
        backgroundColor: '#0B1120',
        color: 'white',
        fontSize: '14px',
        boxSizing: 'border-box',
    },
    button: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#00E5A0',
        color: '#0B1120',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    error: {
        textAlign: 'center',
        marginTop: '12px',
        color: '#ff4444',
    },
    link: {
        textAlign: 'center',
        marginTop: '16px',
        fontSize: '14px',
        color: '#8A9BBE',
    },
};

export default Login;