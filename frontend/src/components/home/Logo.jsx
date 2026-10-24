import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../pages/Home.module.css';
import { MapPinIcon } from './icons';

function Logo() {
  return (
    <Link to="/" className={styles.logo}>
      <span className={styles.logoIcon}>
        <MapPinIcon />
      </span>
      <span className={styles.logoText}>
        Fix<span>My</span>City — Ahmedabad
      </span>
    </Link>
  );
}

export default Logo;
