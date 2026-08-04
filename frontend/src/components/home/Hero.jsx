import React from 'react';
import styles from '../../pages/Home.module.css';
import { ArrowRightIcon, SparklesIcon, CheckCircleIcon, CameraIcon, BotIcon, MapPinIcon } from './icons';

const HeroVisual = () => (
  <div className={styles.heroVisual}>
    <div className={styles.heroCard}>
      <div className={styles.heroCardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className={styles.liveDot} />
          <span className={styles.liveLabel}>Live Report</span>
        </div>
        <span className={styles.statusBadge}>In progress</span>
      </div>
      <div className={styles.heroCardBody}>
        <div className={styles.issueRow}>
          <div className={styles.issueIcon}>
            <MapPinIcon />
          </div>
          <div>
            <p className={styles.issueTitle}>Pothole on Main St.</p>
            <p className={styles.issueMeta}>Reported 12 min ago • Auto-routed to Public Works</p>
          </div>
        </div>
        <div className={styles.progressSteps}>
          {['Reported', 'Routed', 'Fixing'].map((step) => (
            <div key={step} className={styles.progressStep}>
              <div className={styles.progressDot} />
              <p className={styles.progressLabel}>{step}</p>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.heroStats}>
        {[
          { label: 'Photos', value: '2' },
          { label: 'Votes', value: '18' },
          { label: 'ETA', value: '3d' },
        ].map((stat) => (
          <div key={stat.label} className={styles.heroStat}>
            <p className={styles.heroStatValue}>{stat.value}</p>
            <p className={styles.heroStatLabel}>{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
    <div className={`${styles.floatingIcon} ${styles.floatingIconCamera}`}>
      <CameraIcon />
    </div>
    <div className={`${styles.floatingIcon} ${styles.floatingIconBot}`}>
      <BotIcon />
    </div>
  </div>
);

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBg} />
      <div className={`${styles.container} ${styles.heroInner}`}>
        <div>
          <span className={styles.badge}>
            <SparklesIcon />
            AI-powered civic reporting
          </span>
          <h1>
            Fix Ahmedabad,
            <br />
            <span>Together.</span>
          </h1>
          <p>
            Report Ahmedabad issues and help your city get them fixed. Snap a photo,
            drop a pin, and let smart routing take it from there.
          </p>
          <div className={styles.heroButtons}>
            <a href="/submit-issue" className={styles.btnPrimary}>
              Report an Issue <ArrowRightIcon />
            </a>
            <a href="/admin" className={styles.btnOutline}>Admin Dashboard</a>
          </div>
          <div className={styles.heroChecks}>
            <div>
              <CheckCircleIcon style={{ color: 'var(--teal)' }} />
              No account needed to browse
            </div>
            <div className={styles.hiddenMobile}>
              <CheckCircleIcon style={{ color: 'var(--teal)' }} />
              Real-time updates
            </div>
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}
