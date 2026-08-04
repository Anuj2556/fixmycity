import React from 'react';
import styles from '../../pages/Home.module.css';

function FooterCol({ title, links }) {
  return (
    <div className={styles.footerCol}>
      <h4>{title}</h4>
      <ul>
        {links.map(([label, href]) => (
          <li key={label}>
            <a href={href}>{label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const socialLinks = [
    { icon: 'twitter', label: 'Twitter' },
    { icon: 'facebook', label: 'Facebook' },
    { icon: 'instagram', label: 'Instagram' },
    { icon: 'github', label: 'Github' },
  ];

  const renderIcon = (name) => {
    switch (name) {
      case 'twitter':
        return '🐦';
      case 'facebook':
        return '📘';
      case 'instagram':
        return '📸';
      case 'github':
        return '🐙';
      default:
        return '🔗';
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <a href="/" className={styles.logo}>
              <span className={styles.logoIcon} />
              <span className={styles.logoText}>
                Fix<span>My</span>City — Ahmedabad
              </span>
            </a>
            <p>Civic reporting for modern cities. Built with citizens, for citizens.</p>
            <div className={styles.socialLinks}>
              {socialLinks.map(({ icon, label }) => (
                <a key={label} href="#" className={styles.socialLink} aria-label={label}>
                  {renderIcon(icon)}
                </a>
              ))}
            </div>
          </div>
          <FooterCol title="Product" links={[['Report Issue', '/submit-issue'], ['Dashboard', '/admin'], ['Features', '#features']]} />
          <FooterCol title="Company" links={[['About', '#'], ['Contact', '#'], ['Careers', '#']]} />
          <FooterCol title="Legal" links={[['Privacy Policy', '#'], ['Terms', '#'], ['Cookies', '#']]} />
        </div>
        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} FixMyCity. All rights reserved.</p>
          <p>Made with care for better cities.</p>
        </div>
      </div>
    </footer>
  );
}
