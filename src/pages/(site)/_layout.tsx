import RegisterDialog from '@/components/Auth/RegisterDialog'
import Footer from '@/components/Site/Footer'
import Navbar from '@/components/Site/Navbar'
import GlobalAnnouncement from "@/components/Dashboard/Layouts/GlobalAnnouncement";
import useDialog from '@/hooks/useDialog'
import { Outlet } from 'react-router-dom'
import TermsAgreementDialog from '@/components/Site/TermsAgreementDialog'
import SmoothScroll from '@/components/Site/SmoothScroll'

export default function Layout() {
  useDialog()
  return (
    <div className="bg-background text-white min-h-screen">
      <SmoothScroll>
        <GlobalAnnouncement />
        <Navbar />
        <main className="pt-16 md:pt-32">
          <Outlet />
        </main>
        <Footer />
        <TermsAgreementDialog />
        <RegisterDialog />
      </SmoothScroll>
    </div>
  )
}