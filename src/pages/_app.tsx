import { Outlet, useLocation } from 'react-router-dom'
import ScrollToTop from '@/components/ScrollToTop'
import WhatsAppButton from '@/components/WhatsAppButton'

export default function App() {
  const location = useLocation();
  const isSharpGuy = location.pathname.startsWith("/sharp-guy");

  return (
    <>
      <ScrollToTop />
      {!isSharpGuy && <WhatsAppButton />}
      <Outlet />
    </>
  )
}
