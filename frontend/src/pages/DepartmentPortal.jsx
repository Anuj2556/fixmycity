import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import API, { fetchDepartmentsOverview } from '../services/api';
import {
    CivicShieldIcon,
    LayersIcon,
    AlertCircleIcon,
    ClockIcon,
    CheckIcon,
    BuildingOfficeIcon,
} from '../components/common/Icons';
import styles from './DepartmentPortal.module.css';

function DepartmentPortal() {
    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState(null);
    const [issues, setIssues] = useState([]);
    const [issuesLoading, setIssuesLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionMessage, setActionMessage] = useState('');

    const loadDepartmentIssues = useCallback(async (deptId) => {
        setIssuesLoading(true);
        try {
            const res = await API.get(`/issues/?department=${deptId}`);
            setIssues(res.data);
        } catch (err) {
            console.error('Failed to load issues for department:', err);
        } finally {
            setIssuesLoading(false);
        }
    }, []);

    const loadDepartments = useCallback(async () => {
        try {
            const data = await fetchDepartmentsOverview();
            setDepartments(data);
            if (data.length > 0 && !selectedDept) {
                setSelectedDept(data[0]);
                loadDepartmentIssues(data[0].id);
            }
        } catch (err) {
            console.error('Failed to load departments:', err);
        }
    }, [selectedDept, loadDepartmentIssues]);

    useEffect(() => {
        loadDepartments();
    }, [loadDepartments]);

    const handleSelectDepartment = (dept) => {
        setSelectedDept(dept);
        setStatusFilter('all');
        setPriorityFilter('all');
        setSearchQuery('');
        loadDepartmentIssues(dept.id);
    };

    const handleUpdateStatus = async (issueId, newStatus) => {
        try {
            await API.patch(`/issues/${issueId}/`, { status: newStatus });
            setActionMessage(`Issue #${issueId} status updated to ${newStatus.toUpperCase()}`);
            setTimeout(() => setActionMessage(''), 3000);
            if (selectedDept) {
                loadDepartmentIssues(selectedDept.id);
                loadDepartments();
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const handleAddNote = async (issueId, currentNotes) => {
        const note = window.prompt('Enter Department Resolution / Action Note:', currentNotes || '');
        if (note !== null) {
            try {
                await API.patch(`/issues/${issueId}/`, { department_notes: note });
                setActionMessage(`Note updated for issue #${issueId}`);
                setTimeout(() => setActionMessage(''), 3000);
                if (selectedDept) {
                    loadDepartmentIssues(selectedDept.id);
                }
            } catch (err) {
                console.error('Failed to add note:', err);
            }
        }
    };

    // Calculate totals across all departments
    const totalComplaints = departments.reduce((acc, d) => acc + (d.metrics?.total || 0), 0);
    const criticalComplaints = departments.reduce((acc, d) => acc + (d.metrics?.critical || 0), 0);
    const inProgressComplaints = departments.reduce((acc, d) => acc + (d.metrics?.in_progress || 0), 0);
    const resolvedComplaints = departments.reduce((acc, d) => acc + (d.metrics?.resolved || 0), 0);

    // Filter issues for current console view
    const filteredIssues = issues.filter((issue) => {
        if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchTitle = (issue.title || '').toLowerCase().includes(q);
            const matchDesc = (issue.description || '').toLowerCase().includes(q);
            return matchTitle || matchDesc;
        }
        return true;
    });

    return (
        <div className={styles.body}>
            <Navbar />

            <div className={styles.container}>
                {/* Header Section */}
                <div className={styles.headerSection}>
                    <div className={styles.badge}>
                        <CivicShieldIcon size={14} />
                        <span>AMC Operations Command Console</span>
                    </div>
                    <h1 className={styles.title}>Municipal Department Hub</h1>
                    <p className={styles.subtitle}>
                        Dedicated dispatch operations hub for Ahmedabad Municipal Corporation departments. Monitor AI-routed civic complaints, prioritize emergency safety hazards, and manage resolution workflows.
                    </p>
                </div>

                {/* Global Metrics Strip */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}><LayersIcon size={22} /></div>
                        <div>
                            <div className={styles.statValue}>{totalComplaints}</div>
                            <div className={styles.statLabel}>Total Complaints</div>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.criticalAlert}`}><AlertCircleIcon size={22} /></div>
                        <div>
                            <div className={`${styles.statValue} ${styles.criticalAlert}`}>{criticalComplaints}</div>
                            <div className={styles.statLabel}>Critical Hazards</div>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon}><ClockIcon size={22} /></div>
                        <div>
                            <div className={styles.statValue}>{inProgressComplaints}</div>
                            <div className={styles.statLabel}>Active Dispatch</div>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon}><CheckIcon size={22} /></div>
                        <div>
                            <div className={styles.statValue}>{resolvedComplaints}</div>
                            <div className={styles.statLabel}>Resolved Cases</div>
                        </div>
                    </div>
                </div>

                {/* Department Hub Selector */}
                <div className={styles.sectionTitle}>
                    <BuildingOfficeIcon size={20} />
                    <span>{departments.length === 1 ? 'Your Assigned Department Queue' : 'Select Municipal Department Queue'}</span>
                </div>


                <div className={styles.deptGrid}>
                    {departments.map((dept) => {
                        const isSelected = selectedDept?.id === dept.id;
                        return (
                            <div
                                key={dept.id}
                                className={`${styles.deptCard} ${isSelected ? styles.deptCardActive : ''}`}
                                onClick={() => handleSelectDepartment(dept)}
                            >
                                <div className={styles.deptHeader}>
                                    <div className={styles.deptIcon}>{dept.icon || '🏢'}</div>
                                    <div>
                                        <div className={styles.deptName}>{dept.name}</div>
                                        <div className={styles.deptCode}>AMC Code: {dept.code || 'DEPT'}</div>
                                    </div>
                                </div>

                                <div className={styles.deptDesc}>
                                    {dept.description || 'Handles civic issues and municipal maintenance operations.'}
                                </div>

                                <div className={styles.deptContact}>
                                    <div className={styles.deptOfficer}>👤 {dept.head_officer || 'Municipal Officer'}</div>
                                    <div>📞 {dept.phone} • ✉️ {dept.email}</div>
                                </div>

                                <div className={styles.metricsRow}>
                                    <div className={styles.metricItem}>
                                        <span className={styles.metricNum}>{dept.metrics?.total || 0}</span>
                                        <span className={styles.metricName}>Total</span>
                                    </div>
                                    <div className={styles.metricItem}>
                                        <span className={`${styles.metricNum} ${styles.criticalAlert}`}>{dept.metrics?.critical || 0}</span>
                                        <span className={styles.metricName}>Critical</span>
                                    </div>
                                    <div className={styles.metricItem}>
                                        <span className={styles.metricNum}>{dept.metrics?.in_progress || 0}</span>
                                        <span className={styles.metricName}>Active</span>
                                    </div>
                                    <div className={styles.metricItem}>
                                        <span className={styles.metricNum}>{dept.metrics?.resolved || 0}</span>
                                        <span className={styles.metricName}>Resolved</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Selected Department Operations Console */}
                {selectedDept && (
                    <div className={styles.consoleContainer}>
                        <div className={styles.consoleHeader}>
                            <div className={styles.consoleTitleArea}>
                                <span style={{ fontSize: '32px' }}>{selectedDept.icon || '🏢'}</span>
                                <div>
                                    <div className={styles.consoleTitle}>{selectedDept.name} Console</div>
                                    <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                                        Lead: <strong>{selectedDept.head_officer}</strong> • Hotline: {selectedDept.phone}
                                    </div>
                                </div>
                            </div>

                            {actionMessage && (
                                <div style={{ background: 'rgba(0, 229, 160, 0.15)', color: '#00e5a0', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
                                    ✅ {actionMessage}
                                </div>
                            )}
                        </div>

                        {/* Filter & Search Bar */}
                        <div className={styles.filterBar}>
                            <div className={styles.filterGroup}>
                                <button
                                    className={`${styles.filterBtn} ${statusFilter === 'all' ? styles.filterBtnActive : ''}`}
                                    onClick={() => setStatusFilter('all')}
                                >
                                    All Status ({issues.length})
                                </button>
                                <button
                                    className={`${styles.filterBtn} ${statusFilter === 'pending' ? styles.filterBtnActive : ''}`}
                                    onClick={() => setStatusFilter('pending')}
                                >
                                    Pending
                                </button>
                                <button
                                    className={`${styles.filterBtn} ${statusFilter === 'in_progress' ? styles.filterBtnActive : ''}`}
                                    onClick={() => setStatusFilter('in_progress')}
                                >
                                    In Progress
                                </button>
                                <button
                                    className={`${styles.filterBtn} ${statusFilter === 'resolved' ? styles.filterBtnActive : ''}`}
                                    onClick={() => setStatusFilter('resolved')}
                                >
                                    Resolved
                                </button>
                            </div>

                            <div className={styles.filterGroup}>
                                <button
                                    className={`${styles.filterBtn} ${priorityFilter === 'all' ? styles.filterBtnActive : ''}`}
                                    onClick={() => setPriorityFilter('all')}
                                >
                                    All Priorities
                                </button>
                                <button
                                    className={`${styles.filterBtn} ${priorityFilter === 'critical' ? styles.filterBtnActive : ''}`}
                                    onClick={() => setPriorityFilter('critical')}
                                    style={{ color: priorityFilter === 'critical' ? '#0b1120' : '#f87171' }}
                                >
                                    Critical 🚨
                                </button>
                                <button
                                    className={`${styles.filterBtn} ${priorityFilter === 'high' ? styles.filterBtnActive : ''}`}
                                    onClick={() => setPriorityFilter('high')}
                                    style={{ color: priorityFilter === 'high' ? '#0b1120' : '#fb923c' }}
                                >
                                    High
                                </button>
                                <button
                                    className={`${styles.filterBtn} ${priorityFilter === 'medium' ? styles.filterBtnActive : ''}`}
                                    onClick={() => setPriorityFilter('medium')}
                                >
                                    Medium
                                </button>
                            </div>

                            <input
                                className={styles.searchBox}
                                type="text"
                                placeholder="🔍 Search issues by title or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Issue Cards */}
                        {issuesLoading ? (
                            <div className={styles.emptyState}>Loading department operational queue...</div>
                        ) : filteredIssues.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>🎉</div>
                                <div>No issues found matching this filter criteria for {selectedDept.name}.</div>
                            </div>
                        ) : (
                            <div className={styles.issuesList}>
                                {filteredIssues.map((issue) => {
                                    const priority = (issue.priority || 'medium').toLowerCase();
                                    const status = (issue.status || 'pending').toLowerCase();

                                    const priorityBadgeClass =
                                        priority === 'critical'
                                            ? styles.badgePriorityCritical
                                            : priority === 'high'
                                            ? styles.badgePriorityHigh
                                            : priority === 'low'
                                            ? styles.badgePriorityLow
                                            : styles.badgePriorityMedium;

                                    const statusBadgeClass =
                                        status === 'resolved'
                                            ? styles.badgeStatusResolved
                                            : status === 'in_progress'
                                            ? styles.badgeStatusInProgress
                                            : styles.badgeStatusPending;

                                    return (
                                        <div key={issue.id} className={styles.issueCard}>
                                            <div className={styles.issueCardHeader}>
                                                <div>
                                                    <div className={styles.issueTitle}>{issue.title}</div>
                                                    <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '3px' }}>
                                                        Reported by {issue.submitted_by_username || 'Citizen'} • {new Date(issue.created_at).toLocaleString()} • 📍 {issue.latitude?.toFixed(4)}°N, {issue.longitude?.toFixed(4)}°E
                                                    </div>
                                                </div>

                                                <div className={styles.badgeRow}>
                                                    <span className={priorityBadgeClass}>
                                                        {priority === 'critical' && '⚡ '}
                                                        {priority.toUpperCase()} PRIORITY
                                                    </span>
                                                    <span className={statusBadgeClass}>
                                                        {status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={styles.issueDesc}>{issue.description}</div>

                                            {/* AI Intelligence Box */}
                                            {issue.ai_reasoning && (
                                                <div className={styles.aiBox}>
                                                    <span>🤖</span>
                                                    <div>
                                                        <strong>AI Classification Intelligence:</strong> {issue.ai_reasoning} {issue.ai_confidence ? `(Confidence: ${(issue.ai_confidence * 100).toFixed(0)}%)` : ''}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Department Resolution Notes */}
                                            {issue.department_notes && (
                                                <div className={styles.deptNotesBox}>
                                                    <div className={styles.deptNotesTitle}>📝 Department Resolution Progress</div>
                                                    <div>{issue.department_notes}</div>
                                                </div>
                                            )}

                                            {/* Action Bar */}
                                            <div className={styles.actionFooter}>
                                                <div className={styles.actionMeta}>
                                                    Issue ID: #{issue.id} • Category: {issue.category}
                                                </div>

                                                <div className={styles.actionBtns}>
                                                    {status !== 'in_progress' && (
                                                        <button
                                                            className={styles.btnInProgress}
                                                            onClick={() => handleUpdateStatus(issue.id, 'in_progress')}
                                                        >
                                                            Dispatch Crew / In Progress
                                                        </button>
                                                    )}

                                                    {status !== 'resolved' && (
                                                        <button
                                                            className={styles.btnResolve}
                                                            onClick={() => handleUpdateStatus(issue.id, 'resolved')}
                                                        >
                                                            Mark Resolved ✅
                                                        </button>
                                                    )}

                                                    {status === 'resolved' && (
                                                        <button
                                                            className={styles.btnInProgress}
                                                            onClick={() => handleUpdateStatus(issue.id, 'pending')}
                                                        >
                                                            Reopen Issue
                                                        </button>
                                                    )}

                                                    <button
                                                        className={styles.btnNote}
                                                        onClick={() => handleAddNote(issue.id, issue.department_notes)}
                                                    >
                                                        {issue.department_notes ? 'Edit Action Note' : '+ Add Note'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DepartmentPortal;
