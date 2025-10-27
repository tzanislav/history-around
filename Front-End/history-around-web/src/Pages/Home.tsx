import React from 'react';
import '../CSS/Home.css'; // Assuming you will create a CSS file for styling
const Home: React.FC = () => {
    return (
        <div className="home-container">
            <h1 className="home-title">Welcome to History Around</h1>
            <p className="home-description">Explore historical events and timelines.</p>
        </div>
    );
};

export default Home;