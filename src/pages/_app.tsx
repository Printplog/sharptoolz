import { Outlet } from 'react-router-dom'
import ScrollToTop from '@/components/ScrollToTop'
import WhatsAppButton from '@/components/WhatsAppButton'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <WhatsAppButton />
      <Outlet />
    </>
  )
}
