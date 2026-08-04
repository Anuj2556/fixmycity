import React from 'react';
import styles from '../../pages/Home.module.css';

export default function Features() {
  const features = [
    { icon: 'bot', title: 'AI Auto-Categorization', desc: 'Reports are classified and routed to the right department automatically.' },
    { icon: 'activity', title: 'Real-time Status Tracking', desc: 'See every state change as departments pick up and resolve issues.' },
    { icon: 'map', title: 'Interactive Map Pinning', desc: 'Drop a precise pin on the map so crews find the spot with zero guesswork.' },
    { icon: 'search', title: 'Secure Location Search', desc: 'Fast, privacy-first location search backed by verified geodata.' },
    { icon: 'building', title: 'Department Management', desc: 'Admins organize teams, assign roles, and monitor workload at a glance.' },
    { icon: 'eye', title: 'Public Dashboard', desc: 'Full transparency — every citizen can watch progress across the city.' },
  ];

  const renderIcon = (name) => {
    switch (name) {
      case 'bot':
        return <span className={styles.featureIcon}>🤖</span>;
      case 'activity':
        return <span className={styles.featureIcon}>⚡</span>;
      case 'map':
        return <span className={styles.featureIcon}>📍</span>;
      case 'search':
        return <span className={styles.featureIcon}>🔎</span>;
      case 'building':
        return <span className={styles.featureIcon}>🏢</span>;
      case 'eye':
        return <span className={styles.featureIcon}>👁️</span>;
      default:
        return <span className={styles.featureIcon}>✨</span>;
    }
  };

  return (
    <section id="features" className={styles.featuresSection}>
      <div className={styles.container}>
        <div className={styles.featuresHeader}>
          <h2 className={styles.sectionTitle}>Everything a modern city needs</h2>
          <p className={styles.sectionSubtitle}>Built for citizens, tuned for departments, transparent by default.</p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((feature) => (
            <div key={feature.title} className={`${styles.card} ${styles.featureCard}`}>
              {renderIcon(feature.icon)}
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
