import React from 'react';
import styles from '../../pages/Home.module.css';
import { ArrowRightIcon, SparklesIcon, CheckCircleIcon, CameraIcon, BotIcon, MapPinIcon } from './icons';
import { getUserRole } from '../../services/api';


const HeroVisual = () => (
  <div className={styles.heroVisual}>
    <div className={styles.heroCard}>
      <div className={styles.heroCardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className={styles.liveDot} />
          <span className={styles.liveLabel}>Live AMC Dispatch</span>
        </div>
        <span className={styles.statusBadge}>In Progress</span>
      </div>

      <div className={styles.heroCardBody}>
        <div className={styles.issueRow}>
          <div className={styles.issueIcon}>
            <MapPinIcon />
          </div>
          <div>
            <p className={styles.issueTitle}>High Voltage Line Sparking on Ashram Road</p>
            <p className={styles.issueMeta}>Navrangpura Ward • Auto-routed to Electricity & Street Lighting</p>
          </div>
        </div>

        <div className={styles.aiTagRow}>
          <span className={styles.aiTag}>AI Priority: Critical</span>
          <span className={styles.aiTagSubtle}>Confidence: 96%</span>
        </div>

        <div className={styles.progressSteps}>
          {[
            { label: 'Citizen Reported', active: true },
            { label: 'AI Classified', active: true },
            { label: 'AMC En Route', active: true },
          ].map((step) => (
            <div key={step.label} className={`${styles.progressStep} ${step.active ? styles.progressStepActive : ''}`}>
              <div className={styles.progressDot} />
              <p className={styles.progressLabel}>{step.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.heroStats}>
        {[
          { label: 'Ward', value: 'Ashram Rd' },
          { label: 'Department', value: 'Electricity' },
          { label: 'Response Target', value: '< 2 Hrs' },
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
  const isStaff = ['admin', 'department_admin'].includes(getUserRole());

  return (

    <section className={styles.hero}>
      <div className={styles.heroBg} />
      <div className={`${styles.container} ${styles.heroInner}`}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <SparklesIcon />
            <span>Ahmedabad Municipal Corporation • AI Civic Intelligence</span>
          </div>

          <h1 className={styles.heroHeadline}>
            Smarter Civic Action for <span className={styles.heroAccent}>Ahmedabad.</span>
          </h1>

          <p className={styles.heroDescription}>
            Empowering citizens and municipal departments with instant multimodal AI triage. Snap a photo, describe the issue, and watch work orders route directly to the responsible AMC engineers in seconds.
          </p>

          <div className={styles.heroButtons}>
            <a href="/submit-issue" className={styles.btnPrimary}>
              <span>Report Civic Issue</span>
              <ArrowRightIcon />
            </a>
            {isStaff ? (
              <a href="/departments" className={styles.btnOutline}>
                <span>Explore Department Portals</span>
              </a>
            ) : (
              <a href="/issues" className={styles.btnOutline}>
                <span>Track Civic Issues</span>
              </a>
            )}
          </div>


          <div className={styles.heroChecks}>
            <div>
              <CheckCircleIcon style={{ color: 'var(--brand-primary)' }} />
              <span>Strict Ahmedabad geofenced routing</span>
            </div>
            <div>
              <CheckCircleIcon style={{ color: 'var(--brand-primary)' }} />
              <span>Instant AI hazard assessment</span>
            </div>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
