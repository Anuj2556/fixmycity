import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/home';
import Login from './pages/Login';
import Register from './pages/register';
import SubmitIssue from './pages/SubmitIssue';
import IssueTracking from './pages/IssueTracking';
import AdminDashboard from './pages/AdminDashboard';
import { isAuthenticated, isAdmin } from './services/api';

function App() {
    const [authenticated, setAuthenticated] = useState(() => isAuthenticated());
    const [adminAccess, setAdminAccess] = useState(() => isAdmin());

    useEffect(() => {
        const syncAuthState = () => {
            setAuthenticated(isAuthenticated());
            setAdminAccess(isAdmin());
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
                    element={authenticated ? <Navigate to={adminAccess ? '/admin' : '/issues'} replace /> : <Login />}
                />
                <Route
                    path="/register"
                    element={authenticated ? <Navigate to={adminAccess ? '/admin' : '/issues'} replace /> : <Register />}
                />
                {/* backward-compatible alias: /dashboard -> /admin */}
                <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
                <Route
                    path="/submit-issue"
                    element={authenticated ? <SubmitIssue /> : <Navigate to="/login" replace />}
                />
                <Route
                    path="/issues"
                    element={authenticated ? <IssueTracking /> : <Navigate to="/login" replace />}
                />
                <Route
                    path="/admin"
                    element={authenticated && adminAccess ? <AdminDashboard /> : <Navigate to="/login" replace />}
                />
            </Routes>
        </Router>
    );
}

export default App;