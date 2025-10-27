import React from 'react';
import '../CSS/Home.css'; // Assuming you will create a CSS file for styling
import UnityPlayer from '../Components/UnityPlayer';
import WelcomeSplash from '../Components/Welcome Splash';
import { useUnityLoader } from '../hooks/useUnityLoader';

const Home: React.FC = () => {
    const unityLoader = useUnityLoader();

    return (
        <div className="home-container">
            <WelcomeSplash unityLoader={unityLoader} />
            <UnityPlayer />
        </div>
    );
};

export default Home;