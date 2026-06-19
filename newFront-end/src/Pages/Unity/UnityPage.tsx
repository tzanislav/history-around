import UnityViewer from '../../Components/UnityViewer/UnityViewer'
import './UnityPage.css'
import NavBar from '../../Components/NavBar/NavBar'

function UnityPage() {
    return (
        <main className="unity-page">
            <NavBar />
            <UnityViewer autoResize />
        </main>
    )
}

export default UnityPage
