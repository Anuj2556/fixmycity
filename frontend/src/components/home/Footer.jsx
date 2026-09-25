import React from 'react';
import styles from '../../pages/Home.module.css';
import { CivicShieldIcon } from '../common/Icons';

function FooterCol({ title, links }) {
  return (
    <div className={styles.footerCol}>
      <h4 className={styles.footerColTitle}>{title}</h4>
      <ul className={styles.footerLinkList}>
        {links.map(([label, href]) => (
          <li key={label}>
            <a href={href} className={styles.footerLink}>{label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <div className={styles.footerLogoMark}>
                <CivicShieldIcon size={18} />
              </div>
              <span className={styles.footerLogoText}>FixMyCity Ahmedabad</span>
            </div>
            <p className={styles.footerDesc}>
              A modern municipal intelligence platform connecting citizens directly with Ahmedabad Municipal Corporation engineering departments for swift defect remediation.
            </p>
          </div>

          <FooterCol
            title="Civic Portal"
            links={[
              ['Report Defect', '/submit-issue'],
              ['Civic Issues Feed', '/issues'],
              ['AMC Department Portals', '/departments'],
              ['Operations Console', '/admin'],
            ]}
          />

          <FooterCol
            title="AMC Departments"
            links={[
              ['Roads & Infrastructure', '/departments'],
              ['Water Supply & Sewerage', '/departments'],
              ['Electricity & Lighting', '/departments'],
              ['Solid Waste Management', '/departments'],
            ]}
          />

          <FooterCol
            title="Account & Governance"
            links={[
              ['Citizen Sign In', '/login'],
              ['Create Account', '/register'],
              ['Citizen Profile', '/profile'],
              ['Civic Trust Framework', '#'],
            ]}
          />
        </div>

        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} FixMyCity Ahmedabad. Dedicated to AMC Civic Operations.</p>
          <p>Ahmedabad Municipal Corporation Geofenced System (22.95°N – 23.12°N)</p>
        </div>
      </div>
    </footer>
  );
}
