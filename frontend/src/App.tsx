import { Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { NoteDetail } from './pages/NoteDetail'
import { Notes } from './pages/Notes'
import { Register } from './pages/Register'
import { Search } from './pages/Search'

export default function App() {
  return (
    <>
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            {/* index route: "/" matches exactly, so "/search" does not fall
                back into the list and no redirect to /login can occur. */}
            <Route index element={<Notes />} />
            <Route path="search" element={<Search />} />
            <Route path="notes/:id" element={<NoteDetail />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}