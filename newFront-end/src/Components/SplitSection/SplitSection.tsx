import { useEffect, useRef, useState } from 'react'
import './SplitSection.css'

type SplitSectionProps = {
  heading: string
  paragraph: string
  imageSrc: string
  imageAlt: string
}

function SplitSection({
  heading,
  paragraph,
  imageSrc,
  imageAlt,
}: SplitSectionProps) {
  const imageWrapRef = useRef<HTMLDivElement>(null)
  const [isImageVisible, setIsImageVisible] = useState(false)

  useEffect(() => {
    const node = imageWrapRef.current

    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries

        if (!entry.isIntersecting) {
          return
        }

        setIsImageVisible(true)
        observer.unobserve(node)
      },
      { threshold: 0.3 },
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <section className="split-section" aria-labelledby="split-section-heading">
      <div className="split-section__text">
        <h2 id="split-section-heading">{heading}</h2>
        <p>{paragraph}</p>
      </div>
      <div
        ref={imageWrapRef}
        className={`split-section__image-wrap ${isImageVisible ? 'is-visible' : ''}`}
      >
        <img className="split-section__image" src={imageSrc} alt={imageAlt} />
      </div>
    </section>
  )
}

export default SplitSection
