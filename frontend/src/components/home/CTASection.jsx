import React from 'react';
import styles from '../../pages/Home.module.css';
import { ArrowRightIcon } from './icons';

export default function CTASection() {
  return (
    <section className={styles.ctaSection}>
      <div className={`${styles.container} ${styles.ctaContent}`}>
        <div className={styles.badge}>
          <span>Join thousands of proactive citizens</span>
        </div>
        <h2 className={styles.ctaHeadline}>
          Help Build a Cleaner, Safer Ahmedabad.
        </h2>
        <p className={styles.ctaSubtitle}>
          Whether it is an open pothole on SG Highway, a water main leak in Maninagar, or an unlit street corner, your report triggers immediate action.
        </p>
        <div className={styles.ctaButtons}>
          <a href="/submit-issue" className={styles.btnPrimary}>
            <span>File a Report Now</span>
            <ArrowRightIcon />
          </a>
          <a href="/issues" className={styles.btnOutline}>
            <span>Browse Civic Feed</span>
          </a>
        </div>
      </div>
    </section>
  );
}
