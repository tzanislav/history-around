import React, { useRef, useEffect, useState } from 'react';
import '../CSS/UnityPlayer.css';

interface UnityPlayerProps {
    width?: number;
    height?: number;
    autoResize?: boolean;
}

const UnityPlayer: React.FC<UnityPlayerProps> = ({ 
    width, 
    height, 
    autoResize = true 
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isUnityLoaded, setIsUnityLoaded] = useState(false);
    const [showControls, setShowControls] = useState(false);

    // Function to send resize command to Unity
    const resizeUnity = (newWidth?: number, newHeight?: number) => {
        if (iframeRef.current && isUnityLoaded) {
            iframeRef.current.contentWindow?.postMessage({
                type: 'RESIZE_UNITY',
                width: newWidth,
                height: newHeight
            }, '*');
        }
    };

    // Function to toggle fullscreen
    const toggleFullscreen = () => {
        if (iframeRef.current && isUnityLoaded) {
            iframeRef.current.contentWindow?.postMessage({
                type: 'TOGGLE_FULLSCREEN'
            }, '*');
        }
    };

    // Preset size functions
    const setPresetSize = (preset: string) => {
        switch (preset) {
            case 'mobile':
                resizeUnity(360, 640);
                break;
            case 'tablet':
                resizeUnity(768, 1024);
                break;
            case 'desktop':
                resizeUnity(1920, 1080);
                break;
            case 'square':
                resizeUnity(800, 800);
                break;
            case 'widescreen':
                resizeUnity(1280, 720);
                break;
            default:
                resizeUnity(); // Auto-resize to container
        }
    };

    // Listen for Unity loading status
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'UNITY_LOADING_COMPLETE') {
                setIsUnityLoaded(true);
                if (autoResize && !width && !height) {
                    // Auto-resize after loading
                    setTimeout(() => resizeUnity(), 1000);
                } else if (width && height) {
                    // Set specific size
                    setTimeout(() => resizeUnity(width, height), 1000);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [width, height, autoResize]);

    // Handle container resize
    useEffect(() => {
        if (!autoResize || !isUnityLoaded) return;

        const handleResize = () => {
            resizeUnity(); // Auto-resize to container
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [autoResize, isUnityLoaded]);

    return (
        <div className='unity-container' ref={containerRef}>
            {/* Unity Controls */}
            <div className='unity-controls'>
                <button 
                    onClick={() => setShowControls(!showControls)}
                    className='unity-controls-toggle'
                    disabled={!isUnityLoaded}
                >
                    ⚙️ Controls
                </button>
                
                {showControls && isUnityLoaded && (
                    <div className='unity-controls-panel'>
                        <div className='unity-controls-section'>
                            <h4>Preset Sizes:</h4>
                            <button onClick={() => setPresetSize('mobile')}>📱 Mobile</button>
                            <button onClick={() => setPresetSize('tablet')}>📱 Tablet</button>
                            <button onClick={() => setPresetSize('desktop')}>🖥️ Desktop</button>
                            <button onClick={() => setPresetSize('square')}>⬜ Square</button>
                            <button onClick={() => setPresetSize('widescreen')}>📺 Widescreen</button>
                        </div>
                        
                        <div className='unity-controls-section'>
                            <h4>Actions:</h4>
                            <button onClick={() => resizeUnity()}>📐 Fit Container</button>
                            <button onClick={toggleFullscreen}>⛶ Fullscreen</button>
                        </div>
                        
                        <div className='unity-controls-section'>
                            <h4>Custom Size:</h4>
                            <input 
                                type="number" 
                                placeholder="Width" 
                                id="custom-width"
                                min="200"
                                max="2000"
                            />
                            <input 
                                type="number" 
                                placeholder="Height" 
                                id="custom-height"
                                min="200"
                                max="2000"
                            />
                            <button onClick={() => {
                                const widthInput = document.getElementById('custom-width') as HTMLInputElement;
                                const heightInput = document.getElementById('custom-height') as HTMLInputElement;
                                const w = parseInt(widthInput.value);
                                const h = parseInt(heightInput.value);
                                if (w && h) resizeUnity(w, h);
                            }}>
                                Apply
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <iframe
                ref={iframeRef}
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