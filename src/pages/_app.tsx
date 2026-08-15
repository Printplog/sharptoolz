import { Outlet } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import ScrollToTop from '@/components/ScrollToTop'
import WhatsAppButton from '@/components/WhatsAppButton'
import SEO from '@/components/SEO'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function App() {
  const isHostedEmbed = window.location.pathname === '/embed'
  const isApiDocs = window.location.pathname === '/api-docs'

  return (
    <HelmetProvider>
      {!isHostedEmbed && <SEO />}
      {!isHostedEmbed && <ScrollToTop />}
      {!isHostedEmbed && !isApiDocs && <WhatsAppButton />}
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </HelmetProvider>
  )
}
