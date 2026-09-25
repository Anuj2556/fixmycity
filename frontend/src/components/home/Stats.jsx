import React from 'react';
import styles from '../../pages/Home.module.css';

export default function Stats() {
  const stats = [
    { value: '5', label: 'AMC Departments Connected', change: 'Roads, Water, Power, Sanitation, Health' },
    { value: '48', label: 'Ahmedabad Wards Monitored', change: 'Covering 22.95°N – 23.12°N' },
    { value: '98.4%', label: 'AI Auto-Routing Precision', change: 'Multimodal Vision + NLP Triage' },
    { value: '< 2 Hrs', label: 'Critical Hazard Response', change: 'Emergency Escalation Workflow' },
  ];

  return (
    <section id="stats" className={styles.statsSection}>
      <div className={styles.container}>
        <div className={styles.statsGrid}>
          {stats.map((item) => (
            <div key={item.label} className={`${styles.card} ${styles.statCard}`}>
              <p className={styles.statValue}>{item.value}</p>
              <p className={styles.statLabel}>{item.label}</p>
              <p className={styles.statChange}>{item.change}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
