import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { getUserRole } from '../services/api';
import Navbar from '../components/Navbar';

import {
  CivicShieldIcon,
  ReportPlusIcon,
  LayersIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  RoadIcon,
  DropletIcon,
  ZapIcon,
  TrashIcon,
  UserIcon,
  BuildingOfficeIcon,
} from '../components/common/Icons';
import styles from './IssueTracking.module.css';

function IssueTracking() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const userRole = getUserRole();
  const isStaff = userRole === 'admin' || userRole === 'department_admin';
  const [scopeFilter, setScopeFilter] = useState(isStaff ? 'all' : 'my');
  const navigate = useNavigate();

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      // Normal citizens are always restricted to their own submitted issues
      const effectiveScope = isStaff ? scopeFilter : 'my';
      const url = effectiveScope === 'my' ? '/issues/?my_issues=true' : '/issues/';
      const res = await API.get(url);
      setIssues(res.data);
    } catch (err) {
      console.error('Error fetching issues:', err);
    } finally {
      setLoading(false);
    }
  }, [isStaff, scopeFilter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);


  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'roads':
        return <RoadIcon size={18} />;
      case 'water':
        return <DropletIcon size={18} />;
      case 'electricity':
        return <ZapIcon size={18} />;
      case 'sanitation':
        return <TrashIcon size={18} />;
      default:
        return <CivicShieldIcon size={18} />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon size={14} />;
      case 'in_progress':
        return <LayersIcon size={14} />;
      case 'resolved':
        return <CheckCircleIcon size={14} />;
      default:
        return <AlertCircleIcon size={14} />;
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

  const getPriorityClass = (priority) => {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'critical') return styles.pillCriticalActive;
    if (p === 'high') return styles.pillHighActive;
    if (p === 'low') return styles.pillLowActive;
    return styles.pillMediumActive;
  };

  const filteredIssues = issues.filter((issue) => {
    if (filter !== 'all' && issue.status !== filter) return false;
    if (priorityFilter !== 'all' && (issue.priority || 'medium') !== priorityFilter) return false;
    return true;
  });

  return (
    <div className={styles.body}>
      <Navbar />

      <div className={styles.container}>
        <div className={styles.headerSection}>
          <h1 className={styles.title}>
            {!isStaff ? 'My Civic Reports' : 'Civic Issue Tracker'}
          </h1>
          <p className={styles.subtitle}>
            {!isStaff
              ? 'Track resolution progress, department notes, and AI triage for complaints submitted by you'
              : userRole === 'department_admin'
              ? 'Real-time municipal queue for complaints assigned to your department'
              : 'Real-time municipal tracking with AI auto-prioritization across Ahmedabad'}
          </p>
        </div>

        {/* View Scope Tabs (Staff only) or Citizen Notice */}
        <div className={styles.scopeWrapper}>
          {isStaff ? (
            <div className={styles.scopeContainer}>
              <button
                onClick={() => setScopeFilter('all')}
                className={`${styles.scopeBtn} ${scopeFilter === 'all' ? styles.scopeBtnActive : ''}`}
              >
                <BuildingOfficeIcon size={15} />
                {userRole === 'department_admin' ? 'Department Queue' : 'All Ahmedabad Issues'}
              </button>
              <button
                onClick={() => setScopeFilter('my')}
                className={`${styles.scopeBtn} ${scopeFilter === 'my' ? styles.scopeBtnActive : ''}`}
              >
                <UserIcon size={15} />
                My Submitted Reports
              </button>
            </div>
          ) : (
            <div className={styles.citizenScopeNotice}>
              <UserIcon size={15} />
              <span>Showing issues submitted by <strong>you</strong></span>
            </div>
          )}
        </div>


        {/* Status Filters */}
        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTab} ${filter === 'all' ? styles.filterTabActive : ''}`}
            onClick={() => setFilter('all')}
          >
            All Statuses ({issues.length})
          </button>
          <button
            className={`${styles.filterTab} ${filter === 'pending' ? styles.filterTabActive : ''}`}
            onClick={() => setFilter('pending')}
          >
            <ClockIcon size={14} /> Pending ({issues.filter(i => i.status === 'pending').length})
          </button>
          <button
            className={`${styles.filterTab} ${filter === 'in_progress' ? styles.filterTabActive : ''}`}
            onClick={() => setFilter('in_progress')}
          >
            <LayersIcon size={14} /> In Progress ({issues.filter(i => i.status === 'in_progress').length})
          </button>
          <button
            className={`${styles.filterTab} ${filter === 'resolved' ? styles.filterTabActive : ''}`}
            onClick={() => setFilter('resolved')}
          >
            <CheckCircleIcon size={14} /> Resolved ({issues.filter(i => i.status === 'resolved').length})
          </button>
        </div>

        {/* Priority Filter Strip */}
        <div className={styles.priorityBar}>
          {['all', 'critical', 'high', 'medium', 'low'].map((p) => {
            const isActive = priorityFilter === p;
            let activeStyle = '';
            if (isActive) {
              if (p === 'all') activeStyle = styles.pillAllActive;
              else if (p === 'critical') activeStyle = styles.pillCriticalActive;
              else if (p === 'high') activeStyle = styles.pillHighActive;
              else if (p === 'medium') activeStyle = styles.pillMediumActive;
              else if (p === 'low') activeStyle = styles.pillLowActive;
            }
            return (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`${styles.priorityPill} ${isActive ? styles.priorityPillActive : ''} ${activeStyle}`}
              >
                {p === 'critical' && <AlertCircleIcon size={13} />}
                {p === 'all' ? 'All Priorities' : `${p.toUpperCase()} Priority`}
              </button>
            );
          })}
        </div>

        {/* Issues List */}
        <div className={styles.issuesList}>
          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrapper}>
                <ClockIcon size={24} />
              </div>
              <h3>Loading civic issues...</h3>
              <p>Syncing municipal reports with Ahmedabad Ward registry...</p>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrapper}>
                <LayersIcon size={24} />
              </div>
              <h3>No issues found</h3>
              <p>No complaints match your active filter criteria.</p>
              <button
                className={styles.emptyButton}
                onClick={() => navigate('/submit-issue')}
              >
                <ReportPlusIcon size={16} />
                Report a New Issue
              </button>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div key={issue.id} className={styles.issueCard}>
                <div className={styles.issueHeader}>
                  <div className={styles.issueTitle}>
                    <div className={styles.categoryIconBadge}>
                      {getCategoryIcon(issue.category)}
                    </div>
                    <h3>{issue.title}</h3>
                  </div>

                  <div className={styles.badgeGroup}>
                    <span className={`${styles.priorityBadge} ${getPriorityClass(issue.priority)}`}>
                      {issue.priority?.toUpperCase()} PRIORITY
                    </span>

                    <div className={`${styles.statusBadge} ${getStatusClass(issue.status)}`}>
                      {getStatusIcon(issue.status)}
                      <span>{issue.status.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <p className={styles.description}>{issue.description}</p>

                {/* AI Classification Intelligence Box */}
                {issue.ai_reasoning && (
                  <div className={styles.aiInsightBox}>
                    <SparklesIcon size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#6366f1' }} />
                    <div>
                      <strong>AI Assessment:</strong> {issue.ai_reasoning}
                    </div>
                  </div>
                )}

                {/* Department Action Notes */}
                {issue.department_notes && (
                  <div className={styles.deptNoteBox}>
                    <BuildingOfficeIcon size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--brand-primary)' }} />
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Department Resolution Note:</strong> {issue.department_notes}
                    </div>
                  </div>
                )}

                {issue.photo && (
                  <img
                    src={issue.photo}
                    alt="Civic issue evidence"
                    className={styles.issuePhoto}
                  />
                )}

                <div className={styles.metaInfo}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Category:</span>
                    <span className={styles.metaValue}>
                      {issue.category?.charAt(0).toUpperCase() + issue.category?.slice(1)}
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Department:</span>
                    <span className={styles.metaValue}>
                      {issue.department_name || 'Ahmedabad Municipal Corporation'}
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Submitted:</span>
                    <span className={styles.metaValue}>
                      {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Coordinates:</span>
                    <span className={styles.metaValue}>
                      {issue.latitude?.toFixed(4)}°N, {issue.longitude?.toFixed(4)}°E
                    </span>
                  </div>
                </div>

                <div className={styles.timeline}>
                  <div className={`${styles.timelineStep} ${issue.status !== 'pending' ? styles.timelineStepActive : ''}`}>
                    <div className={styles.timelineCircle}>
                      <ClockIcon size={13} />
                    </div>
                    <div className={styles.timelineLabel}>Submitted</div>
                  </div>
                  <div className={styles.timelineConnector} />
                  <div className={`${styles.timelineStep} ${(issue.status === 'in_progress' || issue.status === 'resolved') ? styles.timelineStepActive : ''}`}>
                    <div className={styles.timelineCircle}>
                      <LayersIcon size={13} />
                    </div>
                    <div className={styles.timelineLabel}>In Progress</div>
                  </div>
                  <div className={styles.timelineConnector} />
                  <div className={`${styles.timelineStep} ${issue.status === 'resolved' ? styles.timelineStepActive : ''}`}>
                    <div className={styles.timelineCircle}>
                      <CheckCircleIcon size={13} />
                    </div>
                    <div className={styles.timelineLabel}>Resolved</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default IssueTracking;