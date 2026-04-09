import React, { useEffect, useState } from "react";
import '../CSS/WelcomeSplash.css';
import type { UnityLoaderState } from '../hooks/useUnityLoader';

interface WelcomeSplashProps {
    unityLoader: UnityLoaderState;
}

const WelcomeSplash: React.FC<WelcomeSplashProps> = ({ unityLoader }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        if (unityLoader.isLoaded) {
            setIsFadingOut(true);
            const hideTimer = window.setTimeout(() => {
                setIsVisible(false);
            }, 1000);

            return () => window.clearTimeout(hideTimer);
        }

        if (unityLoader.isLoading) {
            setIsVisible(true);
            setIsFadingOut(false);
        }
    }, [unityLoader.isLoaded, unityLoader.isLoading]);

    if (!isVisible) {
        return null;
    }

    const getStatusText = () => {
        if (unityLoader.error) {
            return "Error Loading Game";
        }
        if (unityLoader.isLoaded) {
            return "Launching experience...";
        }
        if (unityLoader.isLoading) {
            return `Loading... ${Math.round(unityLoader.progress)}%`;
        }

        return "Loading Game...";
    };

    return (
        <div className={`overlay${isFadingOut ? ' fade-out' : ''}`}>
            <div className="welcome-splash">
                <h1>Welcome to Real Vision of History</h1>
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
                <p className="status-text">{getStatusText()}</p>
            </div>
        </div>
    );
};

export default WelcomeSplash;