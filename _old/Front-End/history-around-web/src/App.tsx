import { Routes, Route} from 'react-router-dom'
import './CSS/App.css'
import Home from './Pages/Home'
import About from './Pages/About'
import Contacts from './Pages/Contacts'
import Header from './Components/Header'
import Footer from './Components/Footer'

function App() {
  return (
    <div className="app">
      <Header />
      {/* Main Content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contacts" element={<Contacts />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
