import React from 'react';
import styles from '../../pages/Home.module.css';

export default function CTASection() {
  return (
    <section className={styles.ctaSection}>
      <div className={`${styles.container} ${styles.ctaContent}`}>
        <span className={styles.badge}>
          Join thousands of active citizens
        </span>
        <h2 className={styles.sectionTitle} style={{ marginTop: '20px', fontSize: '2rem' }}>
          Ready to make a difference?
        </h2>
        <p className={styles.sectionSubtitle} style={{ maxWidth: '576px', margin: '16px auto 0' }}>
          It takes 30 seconds to file your first report. Your city will notice.
        </p>
        <div className={styles.ctaButtons}>
          <a href="/submit-issue" className={styles.btnPrimary}>Report Issue</a>
          <a href="/admin" className={styles.btnOutline}>View Dashboard</a>
        </div>
      </div>
    </section>
  );
}
