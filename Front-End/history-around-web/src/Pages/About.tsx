import React from 'react';
import '../CSS/About.css';

const About: React.FC = () => {
    return (
        <div className="about-container">
            <h1 className="about-title">About History Around</h1>
            <div className="about-content">
                <p>
                    History Around is your gateway to discovering the rich historical heritage 
                    that surrounds you. Our platform connects you with fascinating stories, 
                    landmarks, and events that have shaped the world around us.
                </p>
                <p>
                    Whether you're exploring your local neighborhood or traveling to new places, 
                    History Around helps you uncover the hidden stories and significant moments 
                    that make each location unique and meaningful.
                </p>
            </div>
        </div>
    );
};

export default About;