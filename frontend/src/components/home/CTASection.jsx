import React from 'react';
import { Link } from 'react-router-dom';
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
          <Link to="/submit-issue" className={styles.btnPrimary}>
            <span>File a Report Now</span>
            <ArrowRightIcon />
          </Link>
          <Link to="/issues" className={styles.btnOutline}>
            <span>Browse Civic Feed</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
