import React from 'react';
import '../CSS/Contacts.css';

const Contacts: React.FC = () => {
    return (
        <div className="contacts-container">
            <h1 className="contacts-title">Contact Us</h1>
            <div className="contacts-content">
                <div className="contact-info">
                    <h3>Get in Touch</h3>
                    <p>We'd love to hear from you! Reach out to us for any questions, suggestions, or feedback.</p>
                </div>
                
                <div className="contact-methods">
                    <div className="contact-item">
                        <h4>Email</h4>
                        <p>info@historyaround.com</p>
                    </div>
                    
                    <div className="contact-item">
                        <h4>Phone</h4>
                        <p>+1 (555) 123-4567</p>
                    </div>
                    
                    <div className="contact-item">
                        <h4>Address</h4>
                        <p>123 History Lane<br />Heritage City, HC 12345</p>
                    </div>
                </div>
                
                <div className="contact-form">
                    <h3>Send us a Message</h3>
                    <form>
                        <input type="text" placeholder="Your Name" className="form-input" />
                        <input type="email" placeholder="Your Email" className="form-input" />
                        <textarea placeholder="Your Message" className="form-textarea" rows={5}></textarea>
                        <button type="submit" className="form-button">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contacts;