import { useState, useEffect } from 'react';

export interface UnityLoaderState {
    isLoading: boolean;
    isLoaded: boolean;
    progress: number;
    error: string | null;
}

export const useUnityLoader = (): UnityLoaderState => {
    const [state, setState] = useState<UnityLoaderState>({
        isLoading: false,
        isLoaded: false,
        progress: 0,
        error: null,
    });

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Only accept messages from our Unity iframe
            if (event.origin !== window.location.origin) {
                return;
            }

            const { type, progress, error } = event.data;

            switch (type) {
                case 'UNITY_LOADING_START':
                    setState(prev => ({
                        ...prev,
                        isLoading: true,
                        isLoaded: false,
                        progress: 0,
                        error: null,
                    }));
                    break;

                case 'UNITY_LOADING_PROGRESS':
                    setState(prev => ({
                        ...prev,
                        progress: progress * 100, // Convert to percentage
                    }));
                    break;

                case 'UNITY_LOADING_COMPLETE':
                    setState(prev => ({
                        ...prev,
                        isLoading: false,
                        isLoaded: true,
                        progress: 100,
                        error: null,
                    }));
                    break;

                case 'UNITY_LOADING_ERROR':
                    setState(prev => ({
                        ...prev,
                        isLoading: false,
                        isLoaded: false,
                        error: error,
                    }));
                    break;
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    return state;
};