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
  const [showControls, setShowControls] = useState(false)
  const [customWidth, setCustomWidth] = useState('')
  const [customHeight, setCustomHeight] = useState('')

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

  const toggleFullscreen = () => {
    if (!iframeRef.current || !isUnityLoaded) {
      return
    }

    iframeRef.current.contentWindow?.postMessage(
      {
        type: 'TOGGLE_FULLSCREEN',
      },
      '*',
    )
  }

  const setPresetSize = (preset: 'mobile' | 'tablet' | 'desktop' | 'square' | 'widescreen' | 'fit') => {
    switch (preset) {
      case 'mobile':
        sendResize(360, 640)
        break
      case 'tablet':
        sendResize(768, 1024)
        break
      case 'desktop':
        sendResize(1920, 1080)
        break
      case 'square':
        sendResize(800, 800)
        break
      case 'widescreen':
        sendResize(1280, 720)
        break
      default:
        sendResize()
        break
    }
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'UNITY_LOADING_COMPLETE') {
        return
      }

      setIsUnityLoaded(true)

      if (autoResize && !width && !height) {
        setTimeout(() => sendResize(), 800)
        return
      }

      if (width && height) {
        setTimeout(() => sendResize(width, height), 800)
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

  const applyCustomSize = () => {
    const parsedWidth = Number(customWidth)
    const parsedHeight = Number(customHeight)

    if (!Number.isFinite(parsedWidth) || !Number.isFinite(parsedHeight)) {
      return
    }

    sendResize(parsedWidth, parsedHeight)
  }

  return (
    <div className="unity-viewer">
      <div className="unity-viewer__controls">
        <button
          type="button"
          className="unity-viewer__toggle"
          onClick={() => setShowControls((prev) => !prev)}
          disabled={!isUnityLoaded}
        >
          Controls
        </button>


        {showControls && isUnityLoaded ? (
          <div className="unity-viewer__panel">
            <div className="unity-viewer__section">
              <h4>Preset sizes</h4>
              <button type="button" onClick={() => setPresetSize('mobile')}>Mobile</button>
              <button type="button" onClick={() => setPresetSize('tablet')}>Tablet</button>
              <button type="button" onClick={() => setPresetSize('desktop')}>Desktop</button>
              <button type="button" onClick={() => setPresetSize('square')}>Square</button>
              <button type="button" onClick={() => setPresetSize('widescreen')}>Widescreen</button>
            </div>

            <div className="unity-viewer__section">
              <h4>Actions</h4>
              <button type="button" onClick={() => setPresetSize('fit')}>Fit container</button>
              <button type="button" onClick={toggleFullscreen}>Fullscreen</button>
            </div>

            <div className="unity-viewer__section unity-viewer__section--inline">
              <h4>Custom size</h4>
              <input
                type="number"
                min={200}
                max={3000}
                placeholder="Width"
                value={customWidth}
                onChange={(event) => setCustomWidth(event.target.value)}
              />
              <input
                type="number"
                min={200}
                max={3000}
                placeholder="Height"
                value={customHeight}
                onChange={(event) => setCustomHeight(event.target.value)}
              />
              <button type="button" onClick={applyCustomSize}>Apply</button>
            </div>
          </div>
        ) : null}
      </div>

      <iframe
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
