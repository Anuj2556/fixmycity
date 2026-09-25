import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/navbar';

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
    localStorage.removeItem('token');
    navigate('/login');
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

  return (
    <div style={styles.body}>
      {/* NAVBAR */}
      <Navbar userType="citizen" />

      {/* MAIN CONTAINER */}
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.headerSection}>
          <h1 style={styles.title}>Your Issues</h1>
          <p style={styles.subtitle}>Track the status of issues you've reported</p>
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
            All Issues ({issues.length})
          </button>
          <button
            style={{
              ...styles.filterTab,
              ...(filter === 'pending' ? styles.filterTabActive : {}),
            }}
            onClick={() => setFilter('pending')}
          >
            ⏳ Pending ({issues.filter(i => i.status === 'pending').length})
          </button>
          <button
            style={{
              ...styles.filterTab,
              ...(filter === 'in_progress' ? styles.filterTabActive : {}),
            }}
            onClick={() => setFilter('in_progress')}
          >
            ⚙️ In Progress ({issues.filter(i => i.status === 'in_progress').length})
          </button>
          <button
            style={{
              ...styles.filterTab,
              ...(filter === 'resolved' ? styles.filterTabActive : {}),
            }}
            onClick={() => setFilter('resolved')}
          >
            ✅ Resolved ({issues.filter(i => i.status === 'resolved').length})
          </button>
        </div>

        {/* ISSUES LIST */}
        <div style={styles.issuesList}>
          {loading ? (
            <div style={styles.loadingMessage}>Loading your issues...</div>
          ) : filteredIssues.length === 0 ? (
            <div style={styles.emptyMessage}>
              <div style={styles.emptyIcon}>📋</div>
              <h3>No issues found</h3>
              <p>You haven't reported any issues yet.</p>
              <button
                style={styles.emptyButton}
                onClick={() => navigate('/submit-issue')}
              >
                Report Your First Issue
              </button>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div key={issue.id} style={styles.issueCard}>
                {/* HEADER */}
                <div style={styles.issueHeader}>
                  <div style={styles.issueTitle}>
                    <span style={styles.categoryEmoji}>
                      {getCategoryEmoji(issue.category)}
                    </span>
                    <h3>{issue.title}</h3>
                  </div>
                  <div
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(issue.status),
                    }}
                  >
                    {getStatusIcon(issue.status)} {issue.status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>

                {/* DESCRIPTION */}
                <p style={styles.description}>{issue.description}</p>

                {/* PHOTO */}
                {issue.photo && (
                  <img
                    src={issue.photo}
                    alt="Issue"
                    style={styles.issuePhoto}
                  />
                )}

                {/* META INFO */}
                <div style={styles.metaInfo}>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Category:</span>
                    <span style={styles.metaValue}>
                      {issue.category.charAt(0).toUpperCase() + issue.category.slice(1)}
                    </span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Department:</span>
                    <span style={styles.metaValue}>
                      {issue.department_name || 'Pending Assignment'}
                    </span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Submitted:</span>
                    <span style={styles.metaValue}>
                      {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Location:</span>
                    <span style={styles.metaValue}>
                      {issue.latitude.toFixed(4)}°, {issue.longitude.toFixed(4)}°
                    </span>
                  </div>
                </div>

                {/* STATUS TIMELINE */}
                <div style={styles.timeline}>
                  <div
                    style={{
                      ...styles.timelineStep,
                      ...(issue.status !== 'pending' ? styles.timelineStepActive : {}),
                    }}
                  >
                    <div style={styles.timelineCircle}>📋</div>
                    <div style={styles.timelineLabel}>Submitted</div>
                  </div>
                  <div style={styles.timelineConnector} />
                  <div
                    style={{
                      ...styles.timelineStep,
                      ...(issue.status === 'in_progress' || issue.status === 'resolved' ? styles.timelineStepActive : {}),
                    }}
                  >
                    <div style={styles.timelineCircle}>⚙️</div>
                    <div style={styles.timelineLabel}>In Progress</div>
                  </div>
                  <div style={styles.timelineConnector} />
                  <div
                    style={{
                      ...styles.timelineStep,
                      ...(issue.status === 'resolved' ? styles.timelineStepActive : {}),
                    }}
                  >
                    <div style={styles.timelineCircle}>✅</div>
                    <div style={styles.timelineLabel}>Resolved</div>
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
  navActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  submitBtn: {
    backgroundColor: '#00E5A0',
    color: '#0B1120',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    transition: 'all 0.3s ease',
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
    transition: 'all 0.3s ease',
  },
  container: {
    maxWidth: '900px',
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
  issuesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  loadingMessage: {
    textAlign: 'center',
    padding: '40px',
    color: '#8A9BBE',
    fontSize: '16px',
  },
  emptyMessage: {
    textAlign: 'center',
    padding: '60px 40px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(11, 17, 32, 0.08)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyButton: {
    marginTop: '20px',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #00E5A0 0%, #00B87A 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  issueCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(11, 17, 32, 0.08)',
    border: '1px solid #F0F4FF',
  },
  issueHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    gap: '16px',
  },
  issueTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  categoryEmoji: {
    fontSize: '24px',
  },
  statusBadge: {
    padding: '8px 12px',
    borderRadius: '8px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  description: {
    color: '#0B1120',
    fontSize: '14px',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  issuePhoto: {
    width: '100%',
    maxHeight: '200px',
    borderRadius: '8px',
    objectFit: 'cover',
    marginBottom: '16px',
  },
  metaInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#F0F4FF',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  metaItem: {
    fontSize: '12px',
  },
  metaLabel: {
    color: '#8A9BBE',
    fontWeight: '600',
    marginRight: '4px',
  },
  metaValue: {
    color: '#0B1120',
    fontWeight: '500',
  },
  timeline: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #E8ECFF',
  },
  timelineStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    opacity: 0.5,
    transition: 'opacity 0.3s ease',
  },
  timelineStepActive: {
    opacity: 1,
  },
  timelineCircle: {
    fontSize: '20px',
    marginBottom: '4px',
  },
  timelineLabel: {
    fontSize: '11px',
    color: '#8A9BBE',
    fontWeight: '600',
    textAlign: 'center',
  },
  timelineConnector: {
    width: '40px',
    height: '2px',
    backgroundColor: '#E8ECFF',
    flex: 1,
  },
};

export default IssueTracking;