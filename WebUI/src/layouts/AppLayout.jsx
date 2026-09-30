import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

export default function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 md:px-8 py-section">
        <Outlet />
      </main>
    </>
  )
}