import React from 'react';
import styles from './Home.module.css';
import Nav from '../components/home/Nav';
import Hero from '../components/home/Hero';
import Stats from '../components/home/Stats';
import Features from '../components/home/Features';
import CTASection from '../components/home/CTASection';
import Footer from '../components/home/Footer';

function Home() {
    return (
        <div className={styles.home}>
            <Nav />
            <Hero />
            <Stats />
            <Features />
            <CTASection />
            <Footer />
        </div>
    );
}

export default Home;
