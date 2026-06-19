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


  return (
    <div className="unity-viewer">
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
