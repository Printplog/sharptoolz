import { Outlet } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import ScrollToTop from '@/components/ScrollToTop'
import WhatsAppButton from '@/components/WhatsAppButton'
import SEO from '@/components/SEO'

export default function App() {
  return (
    <HelmetProvider>
      <SEO />
      <ScrollToTop />
      <WhatsAppButton />
      <Outlet />
    </HelmetProvider>
  )
}
