import VideoBackground from '../../Components/VideoBackground/VideoBackground'
import Slogan from '../../Components/Slogan/Slogan'
import SplitSection from '../../Components/SplitSection/SplitSection'
import HeroModel from '../../Components/HeroModel/HeroModel'
import NavBar from '../../Components/NavBar/NavBar'
import { Link } from 'react-router-dom'
import './Home.css'

const HERO_VIDEO_URL =
  'back.mp4'



function Home() {
  return (
    <main className="home-page">
      <section id="home" className="home-page__hero">
        <VideoBackground source={HERO_VIDEO_URL} />
        <NavBar />
        <div className="home-page__hero-content">
          <div className="home-page__hero-text">
            <Slogan text="Discover the stories" emphasis="behind every place" />
            <Link className="home-page__cta" to="/unity">Explore Now</Link>
          </div>
          <HeroModel
            customModel={{
              modelPath: '/male.fbx',
              texturePath: '/male_tex.png',
              scale: 0.01,
              positionOffset: [0, -0.7, 0],
              rotationOffset: [0.1, 20, .1],
            }}
          />
        </div>
      </section>

      <section id="about">
        <SplitSection
          heading="Based on photogrammetric 3D scans of real-world locations"
          paragraph="History Around reveals the stories hidden in landmarks, neighborhoods, and forgotten corners. From iconic monuments to overlooked streets, each location becomes a gateway into the past with context that is easy to explore and impossible to forget."
          imageSrc="images/drone_1.jpg"
          imageAlt="Ancient city architecture overlooking a river"
        />
      </section>
            <section id="about2">
        <SplitSection
          heading="Walk Through Time, One Street at a Time"
          paragraph="History Around reveals the stories hidden in landmarks, neighborhoods, and forgotten corners. From iconic monuments to overlooked streets, each location becomes a gateway into the past with context that is easy to explore and impossible to forget."
          imageSrc="images/street.jpg"
          imageAlt="Ancient city architecture overlooking a river"
        />
      </section>
            <section id="about3">
        <SplitSection
          heading="Acheived through  a collaboration with the EU"
          paragraph="History Around reveals the stories hidden in landmarks, neighborhoods, and forgotten corners. From iconic monuments to overlooked streets, each location becomes a gateway into the past with context that is easy to explore and impossible to forget."
          imageSrc="images/eu.jpg"
          imageAlt="Ancient city architecture overlooking a river"
        />
      </section>

      <section id="contact" className="home-page__contact">
        <h2>Contact Us</h2>
        <p>Want to collaborate, share local stories, or request a feature? Reach out and help shape History Around.</p>
      </section>
    </main>
  )
}

export default Home
