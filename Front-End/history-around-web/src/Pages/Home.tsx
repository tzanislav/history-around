import React from 'react';
import '../CSS/Home.css'; // Assuming you will create a CSS file for styling
import UnityPlayer from '../Components/UnityPlayer';
import WelcomeSplash from '../Components/Welcome Splash';
import { useUnityLoader } from '../hooks/useUnityLoader';
import EUBanner from '../Components/EU-Banner';

const Home: React.FC = () => {
    const unityLoader = useUnityLoader();

    return (
        <div className="home-container">
            <WelcomeSplash unityLoader={unityLoader} />
            {/* UnityPlayer with auto-resize enabled (default) */}
            <UnityPlayer autoResize={true} />
            
            {/* Alternative usage examples:
            <UnityPlayer width={800} height={600} autoResize={false} />
            <UnityPlayer width={1920} height={1080} />
            */}
            <EUBanner />
        </div>
    );
};

export default Home;