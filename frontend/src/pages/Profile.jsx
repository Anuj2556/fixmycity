import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API, { fetchUserProfile, updateUserProfile } from '../services/api';
import {
    ReportPlusIcon,
    UserIcon,
    AdminBadgeIcon,
    BuildingOfficeIcon,
    SettingsIcon,
    FileTextIcon,
    CheckCircleIcon,
} from '../components/common/Icons';
import styles from './Profile.module.css';

function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [myIssues, setMyIssues] = useState([]);
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        address: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ text: '', type: '' });

    const loadData = async () => {
        setLoading(true);
        try {
            const userData = await fetchUserProfile();
            setUser(userData);
            setFormData({
                email: userData.email || '',
                phone: userData.profile?.phone || '',
                address: userData.profile?.address || '',
            });

            // Fetch issues reported by this user
            const issuesRes = await API.get('/issues/?my_issues=true');
            setMyIssues(issuesRes.data);
        } catch (err) {
            console.error('Failed to load profile data:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await updateUserProfile(formData);
            setUser(updated);
            setToast({ text: 'Profile information updated successfully.', type: 'success' });
            setTimeout(() => setToast({ text: '', type: '' }), 3500);
        } catch (err) {
            console.error('Failed to update profile:', err);
            setToast({ text: 'Failed to update profile changes.', type: 'error' });
        }
        setSaving(false);
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.slice(0, 2).toUpperCase();
    };

    const totalReported = myIssues.length;
    const resolvedCount = myIssues.filter((i) => i.status === 'resolved').length;
    const pendingCount = myIssues.filter((i) => i.status !== 'resolved').length;
    const engagementScore = totalReported * 100 + resolvedCount * 50;

    return (
        <div className={styles.body}>
            <Navbar />

            <div className={styles.container}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                        Loading profile & civic records...
                    </div>
                ) : (
                    <>
                        {/* Header Profile Card */}
                        <div className={styles.headerCard}>
                            <div className={styles.userProfileArea}>
                                <div className={styles.largeAvatar}>
                                    {getInitials(user?.username)}
                                </div>
                                <div>
                                    <div className={styles.userName}>{user?.username || 'Citizen'}</div>
                                    <div className={styles.userEmail}>{user?.email || 'No email registered'}</div>
                                    <div className={styles.badgeRow}>
                                        <span className={styles.roleBadge}>
                                            {user?.profile?.role === 'admin' ? (
                                                <>
                                                    <AdminBadgeIcon size={14} /> City Administrator
                                                </>
                                            ) : user?.profile?.role === 'department_admin' ? (
                                                <>
                                                    <BuildingOfficeIcon size={14} /> Municipal Department Officer
                                                </>
                                            ) : (
                                                <>
                                                    <UserIcon size={14} /> Verified Citizen
                                                </>
                                            )}
                                        </span>
                                        {user?.profile?.department_name && (
                                            <span className={styles.deptBadge}>
                                                <BuildingOfficeIcon size={13} />
                                                {user.profile.department_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                className={styles.newIssueBtn}
                                onClick={() => navigate('/submit-issue')}
                            >
                                <ReportPlusIcon size={16} />
                                <span>Report New Civic Issue</span>
                            </button>
                        </div>

                        {/* Civic Impact Metrics */}
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <div className={styles.statNumber}>{totalReported}</div>
                                <div className={styles.statLabel}>Issues Reported</div>
                            </div>

                            <div className={styles.statCard}>
                                <div className={`${styles.statNumber} ${styles.statResolved}`}>
                                    {resolvedCount}
                                </div>
                                <div className={styles.statLabel}>Resolved Problems</div>
                            </div>

                            <div className={styles.statCard}>
                                <div className={`${styles.statNumber} ${styles.statPending}`}>
                                    {pendingCount}
                                </div>
                                <div className={styles.statLabel}>In Queue / Active</div>
                            </div>

                            <div className={styles.statCard}>
                                <div className={`${styles.statNumber} ${styles.statScore}`}>
                                    {engagementScore} pts
                                </div>
                                <div className={styles.statLabel}>Civic Impact Score</div>
                            </div>
                        </div>

                        {/* Content Grid: Form + Reported Issues */}
                        <div className={styles.contentGrid}>
                            {/* Personal Details Card */}
                            <div className={styles.card}>
                                <div className={styles.cardTitle}>
                                    <span className={styles.cardTitleIcon}>
                                        <SettingsIcon size={18} />
                                    </span>
                                    <span>Personal & Contact Details</span>
                                </div>

                                <form onSubmit={handleSave}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Username</label>
                                        <input
                                            className={`${styles.input} ${styles.inputDisabled}`}
                                            type="text"
                                            value={user?.username || ''}
                                            disabled
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Account Role</label>
                                        <input
                                            className={`${styles.input} ${styles.inputDisabled}`}
                                            type="text"
                                            value={user?.profile?.role || 'Citizen'}
                                            disabled
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Email Address</label>
                                        <input
                                            className={styles.input}
                                            type="email"
                                            name="email"
                                            placeholder="your.email@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Phone Number</label>
                                        <input
                                            className={styles.input}
                                            type="text"
                                            name="phone"
                                            placeholder="+91-XXXXXXXXXX"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Residential / Ward Area</label>
                                        <input
                                            className={styles.input}
                                            type="text"
                                            name="address"
                                            placeholder="e.g., Navrangpura, Ward 12, Ahmedabad"
                                            value={formData.address}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <button className={styles.saveBtn} type="submit" disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Profile Changes'}
                                    </button>

                                    {toast.text && (
                                        <div className={`${styles.statusToast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
                                            {toast.text}
                                        </div>
                                    )}
                                </form>
                            </div>

                            {/* Reported Issues Card */}
                            <div className={styles.card}>
                                <div className={styles.cardTitle}>
                                    <span className={styles.cardTitleIcon}>
                                        <FileTextIcon size={18} />
                                    </span>
                                    <span>My Reported Issues ({myIssues.length})</span>
                                </div>

                                {myIssues.length === 0 ? (
                                    <div className={styles.emptyStream}>
                                        <CheckCircleIcon size={32} style={{ color: 'var(--brand-primary)', margin: '0 auto' }} />
                                        <div className={styles.emptyStreamTitle}>No civic issues submitted yet</div>
                                        <p className={styles.emptyStreamSub}>
                                            Spot a pothole, leaking water pipe, or broken streetlight? Report it to help Ahmedabad!
                                        </p>
                                    </div>
                                ) : (
                                    <div className={styles.issuesStream}>
                                        {myIssues.map((issue) => (
                                            <div key={issue.id} className={styles.issueItem}>
                                                <div className={styles.issueItemHeader}>
                                                    <div className={styles.issueItemTitle}>
                                                        {issue.title}
                                                    </div>
                                                    <span className={issue.status === 'resolved' ? styles.issueBadgeResolved : styles.issueBadgePending}>
                                                        {issue.status}
                                                    </span>
                                                </div>

                                                <div className={styles.issueItemDesc}>
                                                    {issue.description.slice(0, 120)}...
                                                </div>

                                                <div className={styles.issueMeta}>
                                                    Assigned: <strong>{issue.department_name || 'Municipal Board'}</strong> • Priority: {issue.priority?.toUpperCase()} • {new Date(issue.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Profile;
