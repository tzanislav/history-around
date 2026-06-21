import Home from './Pages/Home/Home'
import UnityPage from './Pages/Unity/UnityPage'
import ContactsPage from './Pages/Contacts/ContactsPage'
import { Navigate, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<Home />} />
      <Route path="/contact" element={<ContactsPage />} />
      <Route path="/unity" element={<UnityPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
