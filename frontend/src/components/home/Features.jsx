import React from 'react';
import styles from '../../pages/Home.module.css';
import {
  SparklesIcon,
  LayersIcon,
  MapPinIcon,
  SearchIcon,
  BuildingOfficeIcon,
  CivicShieldIcon
} from '../common/Icons';

export default function Features() {
  const features = [
    {
      icon: <SparklesIcon size={22} />,
      title: 'Multimodal AI Classification',
      desc: 'MobileNetV2 vision and text NLP analyze photos and descriptions together to classify defect types and determine hazard urgency.',
    },
    {
      icon: <LayersIcon size={22} />,
      title: 'Automated AMC Department Routing',
      desc: 'Work tickets bypass manual bureaucratic delays, landing instantly in the queue of Roads, Water, Power, Sanitation, or Health.',
    },
    {
      icon: <MapPinIcon size={22} />,
      title: 'Strict Ahmedabad Geofencing',
      desc: 'Boundary checking (22.95°N to 23.12°N) ensures all complaints map directly to verified AMC municipal ward coordinates.',
    },
    {
      icon: <BuildingOfficeIcon size={22} />,
      title: 'Dedicated Department Consoles',
      desc: 'Municipal officers access specialized operational hubs to inspect queues, dispatch road crews, and update live work notes.',
    },
    {
      icon: <SearchIcon size={22} />,
      title: 'Real-Time Civic Transparency',
      desc: 'Every citizen can search, filter, and track complaint lifecycles from submission to physical resolution.',
    },
    {
      icon: <CivicShieldIcon size={22} />,
      title: 'Emergency Priority Triage',
      desc: 'Electrocution hazards, water main bursts, and sinkholes trigger critical alerts with explainable AI reasoning.',
    },
  ];

  return (
    <section id="features" className={styles.featuresSection}>
      <div className={styles.container}>
        <div className={styles.featuresHeader}>
          <div className={styles.badge}>
            <span>Core Capabilities</span>
          </div>
          <h2 className={styles.sectionTitle}>Engineered for Civic Speed & Precision</h2>
          <p className={styles.sectionSubtitle}>
            Transforming municipal grievance handling from weeks of paperwork into an automated, real-time civic operations engine.
          </p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((feature) => (
            <div key={feature.title} className={`${styles.card} ${styles.featureCard}`}>
              <div className={styles.featureIconWell}>
                {feature.icon}
              </div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
