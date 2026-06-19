import './VideoBackground.css'

type VideoBackgroundProps = {
  source: string
  poster?: string
}

function VideoBackground({ source, poster }: VideoBackgroundProps) {
  return (
    <div className="video-background" aria-hidden="true">
      <video
        className="video-background__media"
        autoPlay
        loop
        muted
        playsInline
        poster={poster}
      >
        <source src={source} type="video/mp4" />
      </video>
      <div className="video-background__overlay" />
    </div>
  )
}

export default VideoBackground
