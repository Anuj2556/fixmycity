import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { clearAuth } from '../services/api';
import Navbar from '../components/Navbar';
import styles from './AdminDashboard.module.css';

function AdminDashboard() {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchIssues();
    }, []);

    const fetchIssues = async () => {
        try {
            const res = await API.get('/issues/');
            setIssues(res.data);
        } catch (err) {
            console.error('Error fetching issues:', err);
        }
        setLoading(false);
    };

    const handleUpdateStatus = async () => {
        if (!selectedIssue || !newStatus) return;

        try {
            await API.patch(`/issues/${selectedIssue.id}/`, {
                status: newStatus,
            });

            setIssues(issues.map(issue =>
                issue.id === selectedIssue.id
                    ? { ...issue, status: newStatus }
                    : issue
            ));

            setShowModal(false);
            setSelectedIssue(null);
            setNewStatus('');
            fetchIssues();
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'pending':
                return styles.statusPending;
            case 'in_progress':
                return styles.statusInProgress;
            case 'resolved':
                return styles.statusResolved;
            default:
                return styles.statusDefault;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return '⏳';
            case 'in_progress':
                return '⚙️';
            case 'resolved':
                return '✅';
            default:
                return '📋';
        }
    };

    const getCategoryEmoji = (category) => {
        const emojis = {
            roads: '🛣️',
            water: '💧',
            electricity: '⚡',
            sanitation: '🧹',
            other: '📋',
        };
        return emojis[category] || '📋';
    };

    const filteredIssues = filter === 'all'
        ? issues
        : issues.filter(issue => issue.status === filter);

    const stats = {
        total: issues.length,
        pending: issues.filter(i => i.status === 'pending').length,
        inProgress: issues.filter(i => i.status === 'in_progress').length,
        resolved: issues.filter(i => i.status === 'resolved').length,
    };

    return (
        <div className={styles.body}>
            <Navbar />

            <div className={styles.container}>
                <div className={styles.headerSection}>
                    <h1 className={styles.title}>Department Dashboard</h1>
                    <p className={styles.subtitle}>Manage and track all reported issues</p>
                </div>

                <div className={styles.statsGrid}>
                    <div className={`${styles.statCard} ${styles.statCardBlue}`}>
                        <div className={styles.statNumber}>{stats.total}</div>
                        <div className={styles.statLabel}>Total Issues</div>
                    </div>
                    <div className={`${styles.statCard} ${styles.statCardOrange}`}>
                        <div className={styles.statNumber}>{stats.pending}</div>
                        <div className={styles.statLabel}>Pending</div>
                    </div>
                    <div className={`${styles.statCard} ${styles.statCardBlue}`}>
                        <div className={styles.statNumber}>{stats.inProgress}</div>
                        <div className={styles.statLabel}>In Progress</div>
                    </div>
                    <div className={`${styles.statCard} ${styles.statCardGreen}`}>
                        <div className={styles.statNumber}>{stats.resolved}</div>
                        <div className={styles.statLabel}>Resolved</div>
                    </div>
                </div>

                <div className={styles.filterTabs}>
                    <button
                        className={`${styles.filterTab} ${filter === 'all' ? styles.filterTabActive : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All Issues ({stats.total})
                    </button>
                    <button
                        className={`${styles.filterTab} ${filter === 'pending' ? styles.filterTabActive : ''}`}
                        onClick={() => setFilter('pending')}
                    >
                        ⏳ Pending ({stats.pending})
                    </button>
                    <button
                        className={`${styles.filterTab} ${filter === 'in_progress' ? styles.filterTabActive : ''}`}
                        onClick={() => setFilter('in_progress')}
                    >
                        ⚙️ In Progress ({stats.inProgress})
                    </button>
                    <button
                        className={`${styles.filterTab} ${filter === 'resolved' ? styles.filterTabActive : ''}`}
                        onClick={() => setFilter('resolved')}
                    >
                        ✅ Resolved ({stats.resolved})
                    </button>
                </div>

                <div className={styles.tableContainer}>
                    {loading ? (
                        <div className={styles.loadingMessage}>Loading issues...</div>
                    ) : filteredIssues.length === 0 ? (
                        <div className={styles.emptyMessage}>
                            <div className={styles.emptyIcon}>📋</div>
                            <p>No issues found in this category</p>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr className={styles.tableHeader}>
                                    <th className={styles.tableCell}>Issue</th>
                                    <th className={styles.tableCell}>Category</th>
                                    <th className={styles.tableCell}>Status</th>
                                    <th className={styles.tableCell}>Submitted</th>
                                    <th className={styles.tableCell}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIssues.map((issue) => (
                                    <tr key={issue.id} className={styles.tableRow}>
                                        <td className={styles.tableCell}>
                                            <div className={styles.issueInfo}>
                                                <div className={styles.issueTitle}>
                                                    {issue.title}
                                                </div>
                                                <div className={styles.issueDesc}>
                                                    {issue.description.substring(0, 50)}...
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.tableCell}>
                                            <span className={styles.categoryBadge}>
                                                {getCategoryEmoji(issue.category)} {issue.category}
                                            </span>
                                        </td>
                                        <td className={styles.tableCell}>
                                            <span className={`${styles.statusBadge} ${getStatusClass(issue.status)}`}>
                                                {getStatusIcon(issue.status)} {issue.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className={styles.tableCell}>
                                            {new Date(issue.created_at).toLocaleDateString()}
                                        </td>
                                        <td className={styles.tableCell}>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={() => {
                                                    setSelectedIssue(issue);
                                                    setNewStatus(issue.status);
                                                    setShowModal(true);
                                                }}
                                            >
                                                Update
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Update Issue Status</h2>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setShowModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.modalSection}>
                                <h3 className={styles.modalLabel}>Issue</h3>
                                <p className={styles.modalValue}>{selectedIssue?.title}</p>
                            </div>

                            <div className={styles.modalSection}>
                                <h3 className={styles.modalLabel}>Current Status</h3>
                                <p className={styles.modalValue}>
                                    {getStatusIcon(selectedIssue?.status)} {selectedIssue?.status.replace('_', ' ').toUpperCase()}
                                </p>
                            </div>

                            <div className={styles.modalSection}>
                                <h3 className={styles.modalLabel}>New Status</h3>
                                <select
                                    className={styles.selectInput}
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                >
                                    <option value="pending">⏳ Pending</option>
                                    <option value="in_progress">⚙️ In Progress</option>
                                    <option value="resolved">✅ Resolved</option>
                                </select>
                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    className={styles.cancelBtn}
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={styles.saveBtn}
                                    onClick={handleUpdateStatus}
                                >
                                    Update Status
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
