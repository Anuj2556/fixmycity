import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/home';
import Login from './pages/login';
import Register from './pages/register';
import SubmitIssue from './pages/SubmitIssue';
import IssueTracking from './pages/IssueTracking';
import AdminDashboard from './pages/AdminDashboard';
import DepartmentPortal from './pages/DepartmentPortal';
import Profile from './pages/Profile';
import { isAuthenticated, getUserRole } from './services/api';
import { ThemeProvider } from './context/ThemeContext';

function App() {
    const [authenticated, setAuthenticated] = useState(() => isAuthenticated());
    const [userRole, setUserRole] = useState(() => getUserRole());

    useEffect(() => {
        const syncAuthState = () => {
            setAuthenticated(isAuthenticated());
            setUserRole(getUserRole());
        };

        syncAuthState();
        window.addEventListener('authchange', syncAuthState);
        window.addEventListener('storage', syncAuthState);

        return () => {
            window.removeEventListener('authchange', syncAuthState);
            window.removeEventListener('storage', syncAuthState);
        };
    }, []);

    // Least Privilege default destination per role
    const defaultRoleHome = userRole === 'admin'
        ? '/admin'
        : userRole === 'department_admin'
        ? '/departments'
        : '/issues';

    return (
        <ThemeProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route
                        path="/login"
                        element={authenticated ? <Navigate to={defaultRoleHome} replace /> : <Login />}
                    />
                    <Route
                        path="/register"
                        element={authenticated ? <Navigate to={defaultRoleHome} replace /> : <Register />}
                    />
                    {/* backward-compatible alias routes */}
                    <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
                    <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />

                    {/* Citizen-only: Report Issue */}
                    <Route
                        path="/submit-issue"
                        element={
                            authenticated ? (
                                userRole === 'citizen' ? (
                                    <SubmitIssue />
                                ) : (
                                    <Navigate to={defaultRoleHome} replace />
                                )
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />

                    {/* Citizen My Reports Tracking */}
                    <Route
                        path="/issues"
                        element={
                            authenticated ? (
                                userRole === 'citizen' || userRole === 'admin' ? (
                                    <IssueTracking />
                                ) : (
                                    <Navigate to={defaultRoleHome} replace />
                                )
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />

                    {/* Department Officers & City Admins: Department Hub */}
                    <Route
                        path="/departments"
                        element={
                            authenticated ? (
                                userRole === 'department_admin' || userRole === 'admin' ? (
                                    <DepartmentPortal />
                                ) : (
                                    <Navigate to={defaultRoleHome} replace />
                                )
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />

                    {/* City Administrators: Operations Central */}
                    <Route
                        path="/admin"
                        element={
                            authenticated ? (
                                userRole === 'admin' ? (
                                    <AdminDashboard />
                                ) : (
                                    <Navigate to={defaultRoleHome} replace />
                                )
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />

                    {/* All Authenticated Users: Profile */}
                    <Route
                        path="/profile"
                        element={authenticated ? <Profile /> : <Navigate to="/login" replace />}
                    />

                    {/* Catch-all redirect */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;