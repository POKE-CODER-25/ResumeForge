import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import Builder from './pages/Builder'
import CredentialReport from './pages/CredentialReport'
import Download from './pages/Download'
import Editor from './pages/Editor'
import Home from './pages/Home'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/credential-report" element={<CredentialReport />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/download" element={<Download />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
