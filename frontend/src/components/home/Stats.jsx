import React from 'react';
import styles from '../../pages/Home.module.css';

export default function Stats() {
  const stats = [
    { value: '12,480', label: 'Issues Reported', accent: '#00E5A0' },
    { value: '9,215', label: 'Issues Resolved', accent: '#0EA5E9' },
    { value: '38,600', label: 'Active Users', accent: '#8B5CF6' },
    { value: '142', label: 'Cities Onboarded', accent: '#F59E0B' },
  ];

  return (
    <section id="stats" className={styles.statsSection}>
      <div className={styles.container}>
        <div className={styles.statsGrid}>
          {stats.map((item) => (
            <div key={item.label} className={`${styles.card} ${styles.statCard}`} style={{ borderLeft: `4px solid ${item.accent}` }}>
              <p className={styles.statValue}>{item.value}</p>
              <p className={styles.statLabel}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
