import './NavBar.css'

function NavBar() {
  return (
    <header className="nav-bar">
      <a className="nav-bar__logo" href="#home" aria-label="History Around home">
        <span className="nav-bar__logo-mark" aria-hidden="true">HA</span>
        <span className="nav-bar__logo-text">History Around</span>
      </a>

      <nav className="nav-bar__links" aria-label="Primary">
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#contact">Contact Us</a>
      </nav>
    </header>
  )
}

export default NavBar
