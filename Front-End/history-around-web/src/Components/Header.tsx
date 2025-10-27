import React from 'react';
import '../CSS/Header.css'; // Assuming you will create a CSS file for styling
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
    return (
        <header className="header">
            <div className="logo-header">
                <h1>History Around</h1>
            </div>
            <nav className="nav">
                <Link to="/" className="nav-link">Home</Link>
                <Link to="/about" className="nav-link">About</Link>
                <Link to="/contacts" className="nav-link">Contacts</Link>

            </nav>
        </header>
    );
};

export default Header;