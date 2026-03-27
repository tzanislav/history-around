import React from 'react';
import '../CSS/About.css';

const About: React.FC = () => {
    return (
        <div className="about-container">
            <h1 className="about-title">About Real Vision of History</h1>
            <div className="about-content">
                <p>
                    Real Vision of History е вашият пътеводител към откриването на богатото историческо наследство 
                    около вас. Нашата платформа ви свързва с увлекателни истории, забележителности и събития, които са оформили света около нас.
                </p>
                <p>
                    Независимо дали изследвате местния си квартал или пътувате до нови места, 
                    Real Vision of History ви помага да откриете скритите истории и значимите моменти, 
                    които правят всяко място уникално и значимо.
                </p>
            </div>
        </div>
    );
};

export default About;