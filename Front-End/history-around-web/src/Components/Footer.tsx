import React from 'react';
import '../CSS/Footer.css';

const Footer: React.FC = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3 className="footer-title">History Around</h3>
                        <p className="footer-description">
                            Discovering the stories that shaped our world, one location at a time.
                        </p>
                    </div>
                    
                    <div className="footer-section">
                        <h4>Quick Links</h4>
                        <ul className="footer-links">
                            <li><a href="/">Home</a></li>
                            <li><a href="/about">About</a></li>
                            <li><a href="/contacts">Contacts</a></li>
                        </ul>
                    </div>
                    
                    <div className="footer-section">
                        <h4>Connect</h4>
                        <div className="social-links">
                            <span>Follow us on social media</span>
                        </div>
                    </div>
                </div>
                
                <div className="footer-bottom">
                    <p>&copy; 2025 History Around. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;