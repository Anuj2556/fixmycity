import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/Navbar';
import {
    CivicShieldIcon,
    BuildingOfficeIcon,
    ClockIcon,
    LayersIcon,
    CheckCircleIcon,
    AlertCircleIcon,
    ChevronRightIcon,
    XIcon,
    RoadIcon,
    DropletIcon,
    ZapIcon,
    TrashIcon,
    SparklesIcon
} from '../components/common/Icons';
import styles from './AdminDashboard.module.css';

function AdminDashboard() {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const navigate = useNavigate();

    const fetchIssues = async () => {
        try {
            const res = await API.get('/issues/');
            setIssues(res.data);
        } catch (err) {
            console.error('Error fetching issues:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchIssues();
    }, []);

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
                return <ClockIcon size={13} />;
            case 'in_progress':
                return <LayersIcon size={13} />;
            case 'resolved':
                return <CheckCircleIcon size={13} />;
            default:
                return <AlertCircleIcon size={13} />;
        }
    };

    const getCategoryIcon = (category) => {
        switch (category?.toLowerCase()) {
            case 'roads':
                return <RoadIcon size={14} />;
            case 'water':
                return <DropletIcon size={14} />;
            case 'electricity':
                return <ZapIcon size={14} />;
            case 'sanitation':
                return <TrashIcon size={14} />;
            default:
                return <CivicShieldIcon size={14} />;
        }
    };

    const getPriorityClass = (priority) => {
        const p = (priority || 'medium').toLowerCase();
        if (p === 'critical') return styles.priorityCritical;
        if (p === 'high') return styles.priorityHigh;
        if (p === 'low') return styles.priorityLow;
        return styles.priorityMedium;
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
                    <h1 className={styles.title}>Civic Operations Central</h1>
                    <p className={styles.subtitle}>City-wide complaint triage, AI priority monitoring & department resolution</p>
                    <div className={styles.portalBtnWrapper}>
                        <button
                            onClick={() => navigate('/departments')}
                            className={styles.portalBtn}
                        >
                            <BuildingOfficeIcon size={16} />
                            <span>Open Dedicated Department Portals</span>
                            <ChevronRightIcon size={14} />
                        </button>
                    </div>
                </div>

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIconBox} ${styles.statIconTotal}`}>
                            <CivicShieldIcon size={24} />
                        </div>
                        <div>
                            <div className={styles.statNumber}>{stats.total}</div>
                            <div className={styles.statLabel}>Total Issues</div>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={`${styles.statIconBox} ${styles.statIconPending}`}>
                            <ClockIcon size={24} />
                        </div>
                        <div>
                            <div className={styles.statNumber}>{stats.pending}</div>
                            <div className={styles.statLabel}>Pending</div>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={`${styles.statIconBox} ${styles.statIconProgress}`}>
                            <LayersIcon size={24} />
                        </div>
                        <div>
                            <div className={styles.statNumber}>{stats.inProgress}</div>
                            <div className={styles.statLabel}>In Progress</div>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={`${styles.statIconBox} ${styles.statIconResolved}`}>
                            <CheckCircleIcon size={24} />
                        </div>
                        <div>
                            <div className={styles.statNumber}>{stats.resolved}</div>
                            <div className={styles.statLabel}>Resolved</div>
                        </div>
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
                        <ClockIcon size={14} /> Pending ({stats.pending})
                    </button>
                    <button
                        className={`${styles.filterTab} ${filter === 'in_progress' ? styles.filterTabActive : ''}`}
                        onClick={() => setFilter('in_progress')}
                    >
                        <LayersIcon size={14} /> In Progress ({stats.inProgress})
                    </button>
                    <button
                        className={`${styles.filterTab} ${filter === 'resolved' ? styles.filterTabActive : ''}`}
                        onClick={() => setFilter('resolved')}
                    >
                        <CheckCircleIcon size={14} /> Resolved ({stats.resolved})
                    </button>
                </div>

                <div className={styles.tableContainer}>
                    {loading ? (
                        <div className={styles.loadingMessage}>
                            <div className={styles.emptyIconWrapper}>
                                <ClockIcon size={24} />
                            </div>
                            <p>Loading Ahmedabad issue registry...</p>
                        </div>
                    ) : filteredIssues.length === 0 ? (
                        <div className={styles.emptyMessage}>
                            <div className={styles.emptyIconWrapper}>
                                <LayersIcon size={24} />
                            </div>
                            <p>No issues found in this category</p>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr className={styles.tableHeader}>
                                    <th className={styles.tableCell}>Issue</th>
                                    <th className={styles.tableCell}>Category</th>
                                    <th className={styles.tableCell}>Priority (AI)</th>
                                    <th className={styles.tableCell}>Department</th>
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
                                                    {issue.description.substring(0, 60)}...
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.tableCell}>
                                            <span className={styles.categoryBadge}>
                                                {getCategoryIcon(issue.category)}
                                                <span>{issue.category}</span>
                                            </span>
                                        </td>
                                        <td className={styles.tableCell}>
                                            <span className={`${styles.priorityBadge} ${getPriorityClass(issue.priority)}`}>
                                                <SparklesIcon size={12} />
                                                <span>{issue.priority || 'medium'}</span>
                                            </span>
                                        </td>
                                        <td className={styles.tableCell}>
                                            <span className={styles.departmentBadge}>
                                                <BuildingOfficeIcon size={13} />
                                                <span>{issue.department_name || (issue.department?.name || 'Assigned')}</span>
                                            </span>
                                        </td>
                                        <td className={styles.tableCell}>
                                            <span className={`${styles.statusBadge} ${getStatusClass(issue.status)}`}>
                                                {getStatusIcon(issue.status)}
                                                <span>{issue.status.replace('_', ' ')}</span>
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
                                <XIcon size={16} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.modalSection}>
                                <div className={styles.modalLabel}>Issue</div>
                                <p className={styles.modalValue}>{selectedIssue?.title}</p>
                            </div>

                            <div className={styles.modalSection}>
                                <div className={styles.modalLabel}>Current Status</div>
                                <div style={{ display: 'inline-flex', marginTop: '4px' }}>
                                    <span className={`${styles.statusBadge} ${getStatusClass(selectedIssue?.status)}`}>
                                        {getStatusIcon(selectedIssue?.status)}
                                        <span>{selectedIssue?.status?.replace('_', ' ').toUpperCase()}</span>
                                    </span>
                                </div>
                            </div>

                            <div className={styles.modalSection}>
                                <label className={styles.modalLabel}>New Status</label>
                                <select
                                    className={styles.selectInput}
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
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
