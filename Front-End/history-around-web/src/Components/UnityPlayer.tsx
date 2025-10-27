import React from 'react';
import '../CSS/UnityPlayer.css';

const UnityPlayer: React.FC = () => {
    return (
        <div className='unity-container'>
            <iframe
                src="/unity-game.html"
                title="History Around Unity Game"
                className='unity-frame'
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
        </div>
    );
};

export default UnityPlayer;