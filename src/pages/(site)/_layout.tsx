import Footer from '@/components/Site/Footer'
import Navbar from '@/components/Site/Navbar'
import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="bg-[#0f1620] text-white min-h-screen">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}