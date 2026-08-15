import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import ScrollToTop from '@/components/ScrollToTop'
import WhatsAppButton from '@/components/WhatsAppButton'
import SEO from '@/components/SEO'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function App() {
  const location = useLocation()
  const isDeveloperRoot = window.location.hostname.toLowerCase() === 'developer.sharptoolz.com'
    && location.pathname === '/'
  const isHostedEmbed = location.pathname === '/embed'
  const isApiDocs = location.pathname === '/api-docs'

  if (isDeveloperRoot) {
    return <Navigate to="/api-docs" replace />
  }

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
