import { useEffect, useRef, useState } from 'react'
import './UnityViewer.css'

type UnityViewerProps = {
  width?: number
  height?: number
  autoResize?: boolean
}

function UnityViewer({ width, height, autoResize = true }: UnityViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isUnityLoaded, setIsUnityLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [viewerKey, setViewerKey] = useState(0)

  const sendResize = (newWidth?: number, newHeight?: number) => {
    if (!iframeRef.current || !isUnityLoaded) {
      return
    }

    iframeRef.current.contentWindow?.postMessage(
      {
        type: 'RESIZE_UNITY',
        width: newWidth,
        height: newHeight,
      },
      '*',
    )
  }


  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const eventType = event.data?.type

      if (eventType === 'UNITY_LOADING_START') {
        setIsLoading(true)
        setLoadingProgress(0)
        setLoadingError(null)
        return
      }

      if (eventType === 'UNITY_LOADING_PROGRESS') {
        const normalizedProgress = Number(event.data?.progress ?? 0)
        const percent = Math.max(0, Math.min(100, Math.round(normalizedProgress * 100)))
        setLoadingProgress(percent)
        return
      }

      if (eventType === 'UNITY_LOADING_ERROR') {
        setLoadingError(event.data?.error ?? 'Failed to initialize Unity viewer')
        setIsLoading(false)
        setIsUnityLoaded(false)
        return
      }

      if (eventType === 'UNITY_LOADING_COMPLETE') {
        setIsUnityLoaded(true)
        setIsLoading(false)
        setLoadingProgress(100)
        setLoadingError(null)

        if (autoResize && !width && !height) {
          setTimeout(() => sendResize(), 800)
          return
        }

        if (width && height) {
          setTimeout(() => sendResize(width, height), 800)
        }
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [autoResize, width, height])

  useEffect(() => {
    if (!autoResize || !isUnityLoaded) {
      return
    }

    const onResize = () => sendResize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [autoResize, isUnityLoaded])

  const retryLoad = () => {
    setLoadingError(null)
    setIsLoading(true)
    setLoadingProgress(0)
    setIsUnityLoaded(false)
    setViewerKey((prev) => prev + 1)
  }

  return (
    <div className="unity-viewer">
      {(isLoading || loadingError) && (
        <div className="unity-viewer__overlay" role="status" aria-live="polite">
          <div className="unity-viewer__overlay-card">
            {loadingError ? (
              <>
                <p className="unity-viewer__overlay-title">Unity failed to load</p>
                <p className="unity-viewer__overlay-meta">{loadingError}</p>
                <button type="button" className="unity-viewer__retry" onClick={retryLoad}>
                  Retry
                </button>
              </>
            ) : (
              <>
                <p className="unity-viewer__overlay-title">Loading Unity Scene</p>
                <div className="unity-viewer__progress-track">
                  <span
                    className="unity-viewer__progress-fill"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
                <p className="unity-viewer__overlay-meta">{loadingProgress}%</p>
              </>
            )}
          </div>
        </div>
      )}

      <iframe
        key={viewerKey}
        ref={iframeRef}
        src="/unity-game.html"
        title="History Around Unity Viewer"
        className="unity-viewer__frame"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

export default UnityViewer
