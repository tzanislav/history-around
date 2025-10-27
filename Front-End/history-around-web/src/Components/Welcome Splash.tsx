import React, { useState } from "react";
import '../CSS/WelcomeSplash.css';
import type { UnityLoaderState } from '../hooks/useUnityLoader';

interface WelcomeSplashProps {
    unityLoader: UnityLoaderState;
}

const WelcomeSplash: React.FC<WelcomeSplashProps> = ({ unityLoader }) => {
    const [isVisible, setIsVisible] = useState(true);

    const handleGetStarted = () => {
        if (unityLoader.isLoaded) {
            setIsVisible(false);
        }
    };

    if (!isVisible) {
        return null;
    }

    const getButtonText = () => {
        if (unityLoader.error) {
            return "Error Loading Game";
        }
        if (unityLoader.isLoading) {
            return `Loading... ${Math.round(unityLoader.progress)}%`;
        }
        if (unityLoader.isLoaded) {
            return "Start Playing";
        }
        return "Loading Game...";
    };

    const isButtonDisabled = () => {
        return !unityLoader.isLoaded || unityLoader.error !== null;
    };

    return (
        <div className="overlay">
            <div className="welcome-splash">
                <h1>Welcome to History Around</h1>
                <p>Explore historical events and timelines.</p>
                {unityLoader.isLoading && (
                    <div className="loading-progress">
                        <div 
                            className="progress-bar" 
                            style={{ width: `${unityLoader.progress}%` }}
                        ></div>
                    </div>
                )}
                {unityLoader.error && (
                    <p className="error-message">Failed to load game: {unityLoader.error}</p>
                )}
                <button 
                    onClick={handleGetStarted}
                    disabled={isButtonDisabled()}
                    className={isButtonDisabled() ? 'disabled' : ''}
                >
                    {getButtonText()}
                </button>
            </div>
        </div>
    );
};




export default WelcomeSplash;