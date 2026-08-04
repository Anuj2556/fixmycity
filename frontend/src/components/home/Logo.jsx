import React from 'react';
import styles from '../../pages/Home.module.css';
import { MapPinIcon } from './icons';

function Logo() {
  return (
    <a href="/" className={styles.logo}>
      <span className={styles.logoIcon}>
        <MapPinIcon />
      </span>
      <span className={styles.logoText}>
        Fix<span>My</span>City — Ahmedabad
      </span>
    </a>
  );
}

export default Logo;
