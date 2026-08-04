import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { clearAuth } from '../services/api';
import Navbar from '../components/Navbar';
import styles from './IssueTracking.module.css';

function IssueTracking() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
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

  const filteredIssues = filter === 'all'
    ? issues
    : issues.filter(issue => issue.status === filter);

  return (
    <div className={styles.body}>
      <Navbar />

      <div className={styles.container}>
        <div className={styles.headerSection}>
          <h1 className={styles.title}>Your Issues</h1>
          <p className={styles.subtitle}>Track the status of issues you've reported</p>
        </div>

        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTab} ${filter === 'all' ? styles.filterTabActive : ''}`}
            onClick={() => setFilter('all')}
          >
            All Issues ({issues.length})
          </button>
          <button
            className={`${styles.filterTab} ${filter === 'pending' ? styles.filterTabActive : ''}`}
            onClick={() => setFilter('pending')}
          >
            ⏳ Pending ({issues.filter(i => i.status === 'pending').length})
          </button>
          <button
            className={`${styles.filterTab} ${filter === 'in_progress' ? styles.filterTabActive : ''}`}
            onClick={() => setFilter('in_progress')}
          >
            ⚙️ In Progress ({issues.filter(i => i.status === 'in_progress').length})
          </button>
          <button
            className={`${styles.filterTab} ${filter === 'resolved' ? styles.filterTabActive : ''}`}
            onClick={() => setFilter('resolved')}
          >
            ✅ Resolved ({issues.filter(i => i.status === 'resolved').length})
          </button>
        </div>

        <div className={styles.issuesList}>
          {loading ? (
            <div className={styles.loadingMessage}>Loading your issues...</div>
          ) : filteredIssues.length === 0 ? (
            <div className={styles.emptyMessage}>
              <div className={styles.emptyIcon}>📋</div>
              <h3>No issues found</h3>
              <p>You haven't reported any issues yet.</p>
              <button
                className={styles.emptyButton}
                onClick={() => navigate('/submit-issue')}
              >
                Report Your First Issue
              </button>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div key={issue.id} className={styles.issueCard}>
                <div className={styles.issueHeader}>
                  <div className={styles.issueTitle}>
                    <span className={styles.categoryEmoji}>
                      {getCategoryEmoji(issue.category)}
                    </span>
                    <h3>{issue.title}</h3>
                  </div>
                  <div className={`${styles.statusBadge} ${getStatusClass(issue.status)}`}>
                    {getStatusIcon(issue.status)} {issue.status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>

                <p className={styles.description}>{issue.description}</p>

                {issue.photo && (
                  <img
                    src={issue.photo}
                    alt="Issue"
                    className={styles.issuePhoto}
                  />
                )}

                <div className={styles.metaInfo}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Category:</span>
                    <span className={styles.metaValue}>
                      {issue.category.charAt(0).toUpperCase() + issue.category.slice(1)}
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Department:</span>
                    <span className={styles.metaValue}>
                      {issue.department_name || 'Pending Assignment'}
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Submitted:</span>
                    <span className={styles.metaValue}>
                      {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Location:</span>
                    <span className={styles.metaValue}>
                      {issue.latitude.toFixed(4)}°, {issue.longitude.toFixed(4)}°
                    </span>
                  </div>
                </div>

                <div className={styles.timeline}>
                  <div className={`${styles.timelineStep} ${issue.status !== 'pending' ? styles.timelineStepActive : ''}`}>
                    <div className={styles.timelineCircle}>📋</div>
                    <div className={styles.timelineLabel}>Submitted</div>
                  </div>
                  <div className={styles.timelineConnector} />
                  <div className={`${styles.timelineStep} ${(issue.status === 'in_progress' || issue.status === 'resolved') ? styles.timelineStepActive : ''}`}>
                    <div className={styles.timelineCircle}>⚙️</div>
                    <div className={styles.timelineLabel}>In Progress</div>
                  </div>
                  <div className={styles.timelineConnector} />
                  <div className={`${styles.timelineStep} ${issue.status === 'resolved' ? styles.timelineStepActive : ''}`}>
                    <div className={styles.timelineCircle}>✅</div>
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