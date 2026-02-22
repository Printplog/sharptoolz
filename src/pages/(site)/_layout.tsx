import RegisterDialog from '@/components/Auth/RegisterDialog'
import Footer from '@/components/Site/Footer'
import Navbar from '@/components/Site/Navbar'
import GlobalAnnouncement from "@/components/Dashboard/Layouts/GlobalAnnouncement";
import useDialog from '@/hooks/useDialog'
import { Outlet } from 'react-router-dom'

export default function Layout() {
  useDialog()
  return (
    <div className="bg-background text-white min-h-screen">
      <GlobalAnnouncement />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <RegisterDialog />
    </div>
  )
}