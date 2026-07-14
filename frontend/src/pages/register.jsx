import React, { useState } from 'react';
import API from '../services/api';

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post('/register/', formData);
            setMessage(res.data.message);
        } catch (err) {
            setMessage('Registration failed. Try again.');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Register</h2>
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
                        type="email"
                        name="email"
                        placeholder="Email"
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
                        Register
                    </button>
                </form>
                {message && <p style={styles.message}>{message}</p>}
                <p style={styles.link}>
                    Already have an account? <a href="/login">Login</a>
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
        backgroundColor: '#f0f4ff',
    },
    card: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        width: '360px',
    },
    title: {
        textAlign: 'center',
        marginBottom: '24px',
        color: '#0B1120',
    },
    input: {
        width: '100%',
        padding: '12px',
        marginBottom: '16px',
        borderRadius: '8px',
        border: '1px solid #ccc',
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
    message: {
        textAlign: 'center',
        marginTop: '12px',
        color: 'green',
    },
    link: {
        textAlign: 'center',
        marginTop: '16px',
        fontSize: '14px',
    },
};

export default Register;