import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { clearAuth } from '../services/api';
import Navbar from '../components/navbar';

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

            // Update local state
            setIssues(issues.map(issue =>
                issue.id === selectedIssue.id
                    ? { ...issue, status: newStatus }
                    : issue
            ));

            // CLOSE MODAL FIRST
            setShowModal(false);
            setSelectedIssue(null);
            setNewStatus('');

            // REFRESH DATA
            fetchIssues();

        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        }
    };

    const handleLogout = () => {
        clearAuth();
        setTimeout(() => {
            navigate('/', { replace: true });
        }, 0);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return '#FF9800';
            case 'in_progress':
                return '#2196F3';
            case 'resolved':
                return '#00E5A0';
            default:
                return '#8A9BBE';
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
        <div style={styles.body}>
            {/* NAVBAR */}
            <Navbar />


            {/* MAIN CONTAINER */}
            <div style={styles.container}>
                {/* HEADER */}
                <div style={styles.headerSection}>
                    <h1 style={styles.title}>Department Dashboard</h1>
                    <p style={styles.subtitle}>Manage and track all reported issues</p>
                </div>

                {/* STATS CARDS */}
                <div style={styles.statsGrid}>
                    <div style={{ ...styles.statCard, borderLeftColor: '#2196F3' }}>
                        <div style={styles.statNumber}>{stats.total}</div>
                        <div style={styles.statLabel}>Total Issues</div>
                    </div>
                    <div style={{ ...styles.statCard, borderLeftColor: '#FF9800' }}>
                        <div style={styles.statNumber}>{stats.pending}</div>
                        <div style={styles.statLabel}>Pending</div>
                    </div>
                    <div style={{ ...styles.statCard, borderLeftColor: '#2196F3' }}>
                        <div style={styles.statNumber}>{stats.inProgress}</div>
                        <div style={styles.statLabel}>In Progress</div>
                    </div>
                    <div style={{ ...styles.statCard, borderLeftColor: '#00E5A0' }}>
                        <div style={styles.statNumber}>{stats.resolved}</div>
                        <div style={styles.statLabel}>Resolved</div>
                    </div>
                </div>

                {/* FILTER TABS */}
                <div style={styles.filterTabs}>
                    <button
                        style={{
                            ...styles.filterTab,
                            ...(filter === 'all' ? styles.filterTabActive : {}),
                        }}
                        onClick={() => setFilter('all')}
                    >
                        All Issues ({stats.total})
                    </button>
                    <button
                        style={{
                            ...styles.filterTab,
                            ...(filter === 'pending' ? styles.filterTabActive : {}),
                        }}
                        onClick={() => setFilter('pending')}
                    >
                        ⏳ Pending ({stats.pending})
                    </button>
                    <button
                        style={{
                            ...styles.filterTab,
                            ...(filter === 'in_progress' ? styles.filterTabActive : {}),
                        }}
                        onClick={() => setFilter('in_progress')}
                    >
                        ⚙️ In Progress ({stats.inProgress})
                    </button>
                    <button
                        style={{
                            ...styles.filterTab,
                            ...(filter === 'resolved' ? styles.filterTabActive : {}),
                        }}
                        onClick={() => setFilter('resolved')}
                    >
                        ✅ Resolved ({stats.resolved})
                    </button>
                </div>

                {/* ISSUES TABLE */}
                <div style={styles.tableContainer}>
                    {loading ? (
                        <div style={styles.loadingMessage}>Loading issues...</div>
                    ) : filteredIssues.length === 0 ? (
                        <div style={styles.emptyMessage}>
                            <div style={styles.emptyIcon}>📋</div>
                            <p>No issues found in this category</p>
                        </div>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.tableHeader}>
                                    <th style={styles.tableCell}>Issue</th>
                                    <th style={styles.tableCell}>Category</th>
                                    <th style={styles.tableCell}>Status</th>
                                    <th style={styles.tableCell}>Submitted</th>
                                    <th style={styles.tableCell}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIssues.map((issue) => (
                                    <tr key={issue.id} style={styles.tableRow}>
                                        <td style={styles.tableCell}>
                                            <div style={styles.issueInfo}>
                                                <div style={styles.issueTitle}>
                                                    {issue.title}
                                                </div>
                                                <div style={styles.issueDesc}>
                                                    {issue.description.substring(0, 50)}...
                                                </div>
                                            </div>
                                        </td>
                                        <td style={styles.tableCell}>
                                            <span style={styles.categoryBadge}>
                                                {getCategoryEmoji(issue.category)} {issue.category}
                                            </span>
                                        </td>
                                        <td style={styles.tableCell}>
                                            <span
                                                style={{
                                                    ...styles.statusBadge,
                                                    backgroundColor: getStatusColor(issue.status),
                                                }}
                                            >
                                                {getStatusIcon(issue.status)} {issue.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={styles.tableCell}>
                                            {new Date(issue.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={styles.tableCell}>
                                            <button
                                                style={styles.actionBtn}
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

            {/* MODAL */}
            {showModal && (
                <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2>Update Issue Status</h2>
                            <button
                                style={styles.closeBtn}
                                onClick={() => setShowModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={styles.modalBody}>
                            <div style={styles.modalSection}>
                                <h3 style={styles.modalLabel}>Issue</h3>
                                <p style={styles.modalValue}>{selectedIssue?.title}</p>
                            </div>

                            <div style={styles.modalSection}>
                                <h3 style={styles.modalLabel}>Current Status</h3>
                                <p style={styles.modalValue}>
                                    {getStatusIcon(selectedIssue?.status)} {selectedIssue?.status.replace('_', ' ').toUpperCase()}
                                </p>
                            </div>

                            <div style={styles.modalSection}>
                                <h3 style={styles.modalLabel}>New Status</h3>
                                <select
                                    style={styles.selectInput}
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                >
                                    <option value="pending">⏳ Pending</option>
                                    <option value="in_progress">⚙️ In Progress</option>
                                    <option value="resolved">✅ Resolved</option>
                                </select>
                            </div>

                            <div style={styles.modalFooter}>
                                <button
                                    style={styles.cancelBtn}
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    style={styles.saveBtn}
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

const styles = {
    body: {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F9FF 100%)',
        minHeight: '100vh',
        padding: '20px',
    },
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
    navbarBrand: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#0B1120',
    },
    brandAccent: {
        color: '#00E5A0',
    },
    adminBadge: {
        marginLeft: '8px',
        padding: '4px 8px',
        backgroundColor: '#2196F3',
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '700',
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
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
    },
    headerSection: {
        textAlign: 'center',
        marginBottom: '32px',
    },
    title: {
        fontSize: '32px',
        color: '#0B1120',
        marginBottom: '8px',
        fontWeight: '700',
    },
    subtitle: {
        color: '#8A9BBE',
        fontSize: '14px',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
    },
    statCard: {
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(11, 17, 32, 0.08)',
        borderLeft: '4px solid #2196F3',
    },
    statNumber: {
        fontSize: '32px',
        fontWeight: '700',
        color: '#0B1120',
        marginBottom: '8px',
    },
    statLabel: {
        fontSize: '13px',
        color: '#8A9BBE',
        fontWeight: '600',
    },
    filterTabs: {
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap',
    },
    filterTab: {
        padding: '10px 16px',
        border: '1.5px solid #E8ECFF',
        borderRadius: '8px',
        backgroundColor: 'white',
        color: '#0B1120',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '13px',
        transition: 'all 0.3s ease',
    },
    filterTabActive: {
        backgroundColor: '#00E5A0',
        borderColor: '#00E5A0',
        color: 'white',
    },
    tableContainer: {
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(11, 17, 32, 0.08)',
        border: '1px solid #F0F4FF',
        overflow: 'hidden',
    },
    loadingMessage: {
        textAlign: 'center',
        padding: '40px',
        color: '#8A9BBE',
    },
    emptyMessage: {
        textAlign: 'center',
        padding: '60px 40px',
        color: '#8A9BBE',
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '16px',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    tableHeader: {
        backgroundColor: '#F0F4FF',
        borderBottom: '2px solid #E8ECFF',
    },
    tableRow: {
        borderBottom: '1px solid #F0F4FF',
        transition: 'background-color 0.3s ease',
    },
    tableCell: {
        padding: '16px',
        textAlign: 'left',
        fontSize: '13px',
    },
    issueInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    issueTitle: {
        fontWeight: '600',
        color: '#0B1120',
    },
    issueDesc: {
        fontSize: '12px',
        color: '#8A9BBE',
    },
    categoryBadge: {
        display: 'inline-block',
        padding: '6px 10px',
        backgroundColor: '#F0F4FF',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#0B1120',
    },
    statusBadge: {
        display: 'inline-block',
        padding: '6px 10px',
        borderRadius: '6px',
        color: 'white',
        fontSize: '12px',
        fontWeight: '600',
    },
    actionBtn: {
        padding: '6px 12px',
        backgroundColor: '#00E5A0',
        color: '#0B1120',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '12px',
        transition: 'all 0.3s ease',
    },
    // MODAL STYLES
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(11, 17, 32, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(11, 17, 32, 0.3)',
        width: '90%',
        maxWidth: '500px',
    },
    modalHeader: {
        padding: '24px',
        borderBottom: '1px solid #F0F4FF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: '#8A9BBE',
    },
    modalBody: {
        padding: '24px',
    },
    modalSection: {
        marginBottom: '20px',
    },
    modalLabel: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#8A9BBE',
        marginBottom: '8px',
    },
    modalValue: {
        fontSize: '14px',
        color: '#0B1120',
        fontWeight: '500',
    },
    selectInput: {
        width: '100%',
        padding: '12px',
        border: '1.5px solid #E8ECFF',
        borderRadius: '8px',
        fontSize: '14px',
        fontFamily: 'inherit',
        backgroundColor: '#FAFBFF',
    },
    modalFooter: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        paddingTop: '20px',
        borderTop: '1px solid #F0F4FF',
    },
    cancelBtn: {
        padding: '10px 20px',
        backgroundColor: '#F0F4FF',
        color: '#0B1120',
        border: '1px solid #D0D8F0',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '13px',
    },
    saveBtn: {
        padding: '10px 20px',
        backgroundColor: '#00E5A0',
        color: '#0B1120',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '13px',
    },
};

export default AdminDashboard;