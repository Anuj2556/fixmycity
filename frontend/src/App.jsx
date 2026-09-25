import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/home';
import Login from './pages/Login';
import Register from './pages/register';
import SubmitIssue from './pages/SubmitIssue';
import IssueTracking from './pages/IssueTracking';
import AdminDashboard from './pages/AdminDashboard';

function App() {
    const token = localStorage.getItem('token');

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/submit-issue"
                    element={token ? <SubmitIssue /> : <Navigate to="/login" />}
                />
                <Route
                    path="/issues"
                    element={token ? <IssueTracking /> : <Navigate to="/login" />}
                />
                <Route
                    path="/admin"
                    element={token ? <AdminDashboard /> : <Navigate to="/login" />}
                />
            </Routes>
        </Router>
    );
}

export default App;