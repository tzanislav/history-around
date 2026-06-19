import './NavBar.css'
import {NavLink} from 'react-router-dom'

function NavBar() {
  return (
    <header className="nav-bar">
      <NavLink className="nav-bar__logo" to="/" aria-label="History Around home">
        <span className="nav-bar__logo-mark" aria-hidden="true">HA</span>
        <span className="nav-bar__logo-text">History Around</span>
      </NavLink>

      <nav className="nav-bar__links" aria-label="Primary">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/unity">Explore</NavLink>
        <NavLink to="/contact">Contact Us</NavLink>
      </nav>
    </header>
  )
}

export default NavBar
