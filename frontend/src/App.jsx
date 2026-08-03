import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/home';
import Login from './pages/Login';
import Register from './pages/register';
import SubmitIssue from './pages/SubmitIssue';
import IssueTracking from './pages/IssueTracking';
import AdminDashboard from './pages/AdminDashboard';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(typeof window !== 'undefined' ? localStorage.getItem('token') : null));

    useEffect(() => {
        const syncAuthState = () => {
            setIsAuthenticated(Boolean(localStorage.getItem('token')));
        };

        syncAuthState();
        window.addEventListener('authchange', syncAuthState);
        window.addEventListener('storage', syncAuthState);

        return () => {
            window.removeEventListener('authchange', syncAuthState);
            window.removeEventListener('storage', syncAuthState);
        };
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/issues" replace /> : <Login />}
                />
                <Route
                    path="/register"
                    element={isAuthenticated ? <Navigate to="/issues" replace /> : <Register />}
                />
                {/* backward-compatible alias: /dashboard -> /admin */}
                <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
                <Route
                    path="/submit-issue"
                    element={isAuthenticated ? <SubmitIssue /> : <Navigate to="/login" replace />}
                />
                <Route
                    path="/issues"
                    element={isAuthenticated ? <IssueTracking /> : <Navigate to="/login" replace />}
                />
                <Route
                    path="/admin"
                    element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" replace />}
                />
            </Routes>
        </Router>
    );
}

export default App;