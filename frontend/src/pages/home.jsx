import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, isAuthenticated } from "../services/api";

const styles = `
  :root {
    --navy: #0B1120;
    --teal: #00E5A0;
    --sky: #F5F9FF;
    --slate: #8A9BBE;
    --border: #E2E8F0;
    --white: #ffffff;
  }

  .home {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--navy);
    background: var(--white);
    line-height: 1.5;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
  }

  @media (min-width: 640px) {
    .container { padding: 0 24px; }
  }

  @media (min-width: 1024px) {
    .container { padding: 0 32px; }
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    color: var(--navy);
    background: linear-gradient(135deg, #00E5A0 0%, #33ecb4 100%);
    box-shadow: 0 10px 24px -12px rgba(0, 229, 160, 0.4);
    text-decoration: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 32px -14px rgba(0, 229, 160, 0.5);
  }

  .btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    color: var(--navy);
    background: var(--white);
    border: 1px solid rgba(11, 17, 32, 0.12);
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .btn-outline:hover {
    border-color: var(--teal);
    transform: translateY(-2px);
  }

  .card {
    background: var(--white);
    border: 1px solid rgba(11, 17, 32, 0.08);
    border-radius: 16px;
    box-shadow: 0 6px 24px -12px rgba(11, 17, 32, 0.12);
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px -20px rgba(11, 17, 32, 0.15);
  }

  .section-title {
    font-size: 1.875rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--navy);
  }

  @media (min-width: 640px) {
    .section-title { font-size: 2.25rem; }
  }

  .section-subtitle {
    margin-top: 12px;
    color: var(--slate);
  }

  /* Header */
  .header {
    position: sticky;
    top: 0;
    z-index: 40;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(11, 17, 32, 0.08);
  }

  .header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
  }

  .logo-icon {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: linear-gradient(135deg, #00E5A0 0%, #33ecb4 100%);
    box-shadow: 0 8px 20px -8px rgba(0, 229, 160, 0.5);
  }

  .logo-text {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--navy);
  }

  .logo-text span {
    color: var(--teal);
  }

  .nav-links {
    display: none;
    align-items: center;
    gap: 32px;
  }

  @media (min-width: 768px) {
    .nav-links { display: flex; }
  }

  .nav-links a {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--slate);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .nav-links a:hover {
    color: var(--navy);
  }

  .auth-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .auth-buttons .btn-primary,
  .auth-buttons .btn-outline {
    padding: 8px 16px;
    font-size: 0.875rem;
  }

  /* Hero */
  .hero {
    position: relative;
    overflow: hidden;
    background: linear-gradient(180deg, #ffffff 0%, #F5F9FF 100%);
  }

  .hero-bg {
    position: absolute;
    inset: 0;
    opacity: 0.6;
    pointer-events: none;
    background-image:
      radial-gradient(circle at 20% 20%, rgba(0, 229, 160, 0.22), transparent 45%),
      radial-gradient(circle at 80% 30%, rgba(245, 249, 255, 0.8), transparent 55%);
  }

  .hero-inner {
    position: relative;
    display: grid;
    align-items: center;
    gap: 48px;
    padding: 64px 0;
  }

  @media (min-width: 1024px) {
    .hero-inner {
      grid-template-columns: 1fr 1fr;
      padding: 96px 0;
    }
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 9999px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.7);
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--slate);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .hero h1 {
    margin-top: 20px;
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: var(--navy);
  }

  @media (min-width: 640px) {
    .hero h1 { font-size: 3rem; }
  }

  @media (min-width: 1024px) {
    .hero h1 { font-size: 3.75rem; }
  }

  .hero h1 span {
    background: linear-gradient(135deg, #00E5A0 0%, #33ecb4 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero p {
    margin-top: 20px;
    font-size: 1rem;
    color: var(--slate);
    max-width: 576px;
  }

  @media (min-width: 640px) {
    .hero p { font-size: 1.125rem; }
  }

  .hero-buttons {
    margin-top: 32px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .hero-checks {
    margin-top: 32px;
    display: flex;
    align-items: center;
    gap: 24px;
    font-size: 0.75rem;
    color: var(--slate);
  }

  .hero-checks > div {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .hero-visual {
    position: relative;
    max-width: 512px;
    margin: 0 auto;
    width: 100%;
  }

  .hero-card {
    position: relative;
    padding: 24px;
    border-radius: 20px;
    background: var(--white);
    border: 1px solid rgba(11, 17, 32, 0.08);
    box-shadow: 0 20px 40px -20px rgba(11, 17, 32, 0.15);
  }

  .hero-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .live-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--teal);
  }

  .live-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--navy);
  }

  .status-badge {
    padding: 4px 10px;
    border-radius: 9999px;
    background: rgba(0, 229, 160, 0.15);
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--navy);
  }

  .hero-card-body {
    margin-top: 16px;
    padding: 20px;
    border-radius: 16px;
    background: var(--sky);
  }

  .issue-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .issue-icon {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: var(--white);
    flex-shrink: 0;
  }

  .issue-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--navy);
  }

  .issue-meta {
    margin-top: 4px;
    font-size: 0.75rem;
    color: var(--slate);
  }

  .progress-steps {
    margin-top: 16px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .progress-step {
    padding: 8px;
    border-radius: 10px;
    background: var(--white);
    text-align: center;
  }

  .progress-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--teal);
    margin: 0 auto;
  }

  .progress-label {
    margin-top: 8px;
    font-size: 0.625rem;
    font-weight: 600;
    color: var(--navy);
  }

  .hero-stats {
    margin-top: 16px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .hero-stat {
    padding: 12px;
    border-radius: 10px;
    border: 1px solid var(--border);
    text-align: center;
  }

  .hero-stat-value {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--navy);
  }

  .hero-stat-label {
    font-size: 0.625rem;
    color: var(--slate);
  }

  .floating-icon {
    position: absolute;
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    box-shadow: 0 10px 24px -12px rgba(11, 17, 32, 0.2);
  }

  .floating-icon.camera {
    top: -20px;
    right: -16px;
    background: var(--white);
    color: var(--teal);
  }

  .floating-icon.bot {
    bottom: -20px;
    left: -16px;
    background: var(--navy);
    color: var(--teal);
  }

  @media (max-width: 639px) {
    .floating-icon { display: none; }
  }

  /* Stats */
  .stats-section {
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: var(--white);
    padding: 64px 0;
  }

  @media (min-width: 640px) {
    .stats-section { padding: 80px 0; }
  }

  .stats-grid {
    display: grid;
    gap: 20px;
  }

  @media (min-width: 640px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (min-width: 1024px) {
    .stats-grid { grid-template-columns: repeat(4, 1fr); }
  }

  .stat-card {
    padding: 24px;
  }

  .stat-value {
    font-size: 1.875rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--navy);
  }

  @media (min-width: 640px) {
    .stat-value { font-size: 2.25rem; }
  }

  .stat-label {
    margin-top: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--slate);
  }

  /* Features */
  .features-section {
    background: var(--white);
    padding: 80px 0;
  }

  @media (min-width: 640px) {
    .features-section { padding: 96px 0; }
  }

  .features-header {
    text-align: center;
    max-width: 576px;
    margin: 0 auto;
  }

  .features-grid {
    margin-top: 56px;
    display: grid;
    gap: 24px;
  }

  @media (min-width: 640px) {
    .features-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (min-width: 1024px) {
    .features-grid { grid-template-columns: repeat(3, 1fr); }
  }

  .feature-card {
    padding: 24px;
  }

  .feature-icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: rgba(0, 229, 160, 0.12);
    transition: transform 0.25s ease;
  }

  .feature-card:hover .feature-icon {
    transform: scale(1.1);
  }

  .feature-card h3 {
    margin-top: 20px;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--navy);
  }

  .feature-card p {
    margin-top: 8px;
    font-size: 0.875rem;
    color: var(--slate);
  }

  /* CTA */
  .cta-section {
    position: relative;
    overflow: hidden;
    padding: 80px 0;
    background: linear-gradient(135deg, #F5F9FF 0%, #ffffff 60%, rgba(0, 229, 160, 0.08) 100%);
  }

  @media (min-width: 640px) {
    .cta-section { padding: 96px 0; }
  }

  .cta-content {
    position: relative;
    text-align: center;
    max-width: 768px;
    margin: 0 auto;
  }

  .cta-buttons {
    margin-top: 32px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }

  /* Footer */
  .footer {
    border-top: 1px solid var(--border);
    background: var(--white);
    padding: 48px 0 32px;
  }

  .footer-grid {
    display: grid;
    gap: 40px;
  }

  @media (min-width: 768px) {
    .footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr; }
  }

  .footer-brand p {
    margin-top: 16px;
    font-size: 0.875rem;
    color: var(--slate);
    max-width: 320px;
  }

  .social-links {
    margin-top: 20px;
    display: flex;
    gap: 12px;
  }

  .social-link {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    border: 1px solid var(--border);
    color: var(--slate);
    transition: all 0.2s ease;
  }

  .social-link:hover {
    border-color: var(--teal);
    color: var(--navy);
  }

  .footer-col h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--navy);
  }

  .footer-col ul {
    margin-top: 16px;
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .footer-col a {
    font-size: 0.875rem;
    color: var(--slate);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .footer-col a:hover {
    color: var(--navy);
  }

  .footer-bottom {
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-size: 0.75rem;
    color: var(--slate);
  }

  @media (min-width: 640px) {
    .footer-bottom {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
  }
`;

// Inline SVG icons
const MapPinIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ArrowRightIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const SparklesIcon = ({ className }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const CameraIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const BotIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

const ActivityIcon = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-2.48a2 2 0 0 0-1.82 1.17l-2.14 4.72a2 2 0 0 1-3.64 0L7.78 5.08A2 2 0 0 0 5.45 4H2" />
  </svg>
);

const SearchIcon = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const BuildingIcon = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M12 6h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M16 6h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
    <path d="M8 6h.01" />
    <path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    <path d="M6 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14H6z" />
  </svg>
);

const EyeIcon = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const TwitterIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const FacebookIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const GithubIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Logo = () => (
  <a href="/" className="logo">
    <span className="logo-icon">
      <MapPinIcon className="text-navy" />
    </span>
    <span className="logo-text">
      Fix<span>My</span>City — Ahmedabad
    </span>
  </a>
);

const Nav = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(() => isAuthenticated());

  useEffect(() => {
    const syncAuthState = () => setIsLoggedIn(isAuthenticated());
    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("authchange", syncAuthState);
    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("authchange", syncAuthState);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    setIsLoggedIn(false);
    navigate("/", { replace: true });
  };

  return (
    <header className="header">
      <div className="container header-inner">
        <Logo />
        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#stats">Impact</a>
        </nav>
        <div className="auth-buttons">
          {isLoggedIn ? (
            <>
              <button type="button" className="btn-outline" onClick={() => navigate("/issues")}>My Issues</button>
              <button type="button" className="btn-primary" onClick={() => navigate("/submit-issue")}>Report Issue</button>
              <button type="button" className="btn-outline" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <a href="/login" className="btn-outline">Login</a>
              <a href="/register" className="btn-primary">Register</a>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

const HeroVisual = () => (
  <div className="hero-visual">
    <div className="hero-card">
      <div className="hero-card-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="live-dot" />
          <span className="live-label">Live Report</span>
        </div>
        <span className="status-badge">In progress</span>
      </div>
      <div className="hero-card-body">
        <div className="issue-row">
          <div className="issue-icon">
            <MapPinIcon className="text-teal" />
          </div>
          <div>
            <p className="issue-title">Pothole on Main St.</p>
            <p className="issue-meta">Reported 12 min ago • Auto-routed to Public Works</p>
          </div>
        </div>
        <div className="progress-steps">
          {["Reported", "Routed", "Fixing"].map((step) => (
            <div key={step} className="progress-step">
              <div className="progress-dot" />
              <p className="progress-label">{step}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="hero-stats">
        {[
          { label: "Photos", value: "2" },
          { label: "Votes", value: "18" },
          { label: "ETA", value: "3d" },
        ].map((s) => (
          <div key={s.label} className="hero-stat">
            <p className="hero-stat-value">{s.value}</p>
            <p className="hero-stat-label">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
    <div className="floating-icon camera">
      <CameraIcon />
    </div>
    <div className="floating-icon bot">
      <BotIcon />
    </div>
  </div>
);

const Hero = () => (
  <section className="hero">
    <div className="hero-bg" />
    <div className="container hero-inner">
      <div>
        <span className="badge">
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
        <div className="hero-buttons">
          <a href="/submit-issue" className="btn-primary">
            Report an Issue <ArrowRightIcon />
          </a>
          <a href="/admin" className="btn-outline">Admin Dashboard</a>
        </div>
        <div className="hero-checks">
          <div>
            <CheckCircleIcon style={{ color: "var(--teal)" }} />
            No account needed to browse
          </div>
          <div className="hidden-mobile">
            <CheckCircleIcon style={{ color: "var(--teal)" }} />
            Real-time updates
          </div>
        </div>
      </div>
      <HeroVisual />
    </div>
  </section>
);

const Stats = () => {
  const stats = [
    { value: "12,480", label: "Issues Reported", accent: "#00E5A0" },
    { value: "9,215", label: "Issues Resolved", accent: "#0EA5E9" },
    { value: "38,600", label: "Active Users", accent: "#8B5CF6" },
    { value: "142", label: "Cities Onboarded", accent: "#F59E0B" },
  ];

  return (
    <section id="stats" className="stats-section">
      <div className="container">
        <div className="stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="card stat-card" style={{ borderLeft: `4px solid ${s.accent}` }}>
              <p className="stat-value">{s.value}</p>
              <p className="stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    { icon: BotIcon, title: "AI Auto-Categorization", desc: "Reports are classified and routed to the right department automatically." },
    { icon: ActivityIcon, title: "Real-time Status Tracking", desc: "See every state change as departments pick up and resolve issues." },
    { icon: MapPinIcon, title: "Interactive Map Pinning", desc: "Drop a precise pin on the map so crews find the spot with zero guesswork." },
    { icon: SearchIcon, title: "Secure Location Search", desc: "Fast, privacy-first location search backed by verified geodata." },
    { icon: BuildingIcon, title: "Department Management", desc: "Admins organize teams, assign roles, and monitor workload at a glance." },
    { icon: EyeIcon, title: "Public Dashboard", desc: "Full transparency — every citizen can watch progress across the city." },
  ];

  return (
    <section id="features" className="features-section">
      <div className="container">
        <div className="features-header">
          <h2 className="section-title">Everything a modern city needs</h2>
          <p className="section-subtitle">Built for citizens, tuned for departments, transparent by default.</p>
        </div>
        <div className="features-grid">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card feature-card">
              <div className="feature-icon">
                <Icon />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => (
  <section className="cta-section">
    <div className="container cta-content">
      <span className="badge">
        <UsersIcon />
        Join thousands of active citizens
      </span>
      <h2 className="section-title" style={{ marginTop: "20px", fontSize: "2rem" }}>
        Ready to make a difference?
      </h2>
      <p className="section-subtitle" style={{ maxWidth: "576px", margin: "16px auto 0" }}>
        It takes 30 seconds to file your first report. Your city will notice.
      </p>
      <div className="cta-buttons">
        <a href="/submit-issue" className="btn-primary">Report Issue</a>
        <a href="/admin" className="btn-outline">View Dashboard</a>
      </div>
    </div>
  </section>
);

const FooterCol = ({ title, links }) => (
  <div className="footer-col">
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

const Footer = () => {
  const socialLinks = [
    { icon: TwitterIcon, label: "Twitter" },
    { icon: FacebookIcon, label: "Facebook" },
    { icon: InstagramIcon, label: "Instagram" },
    { icon: GithubIcon, label: "Github" },
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo />
            <p>Civic reporting for modern cities. Built with citizens, for citizens.</p>
            <div className="social-links">
              {socialLinks.map(({ icon: Icon, label }) => (
                <a key={label} href="#" className="social-link" aria-label={label}>
                  <Icon />
                </a>
              ))}
            </div>
          </div>
          <FooterCol title="Product" links={[["Report Issue", "/submit-issue"], ["Dashboard", "/admin"], ["Features", "#features"]]} />
          <FooterCol title="Company" links={[["About", "#"], ["Contact", "#"], ["Careers", "#"]]} />
          <FooterCol title="Legal" links={[["Privacy Policy", "#"], ["Terms", "#"], ["Cookies", "#"]]} />
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} FixMyCity. All rights reserved.</p>
          <p>Made with care for better cities.</p>
        </div>
      </div>
    </footer>
  );
};

const Home = () => {
  return (
    <div className="home">
      <style>{styles}</style>
      <Nav />
      <Hero />
      <Stats />
      <Features />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Home;