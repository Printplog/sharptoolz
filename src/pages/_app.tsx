import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import ScrollToTop from '@/components/ScrollToTop'
import WhatsAppButton from '@/components/WhatsAppButton'
import SEO from '@/components/SEO'
import ErrorBoundary from '@/components/ErrorBoundary'
import ApiDocsPage from '@/pages/api-docs'

export default function App() {
  const location = useLocation()
  const isDeveloperHost = window.location.hostname.toLowerCase() === 'developer.sharptoolz.com'
  const isHostedEmbed = location.pathname === '/embed'
  const isApiDocs = isDeveloperHost || location.pathname === '/api-docs'

  if (isDeveloperHost && location.pathname !== '/') {
    return <Navigate to="/" replace />
  }

  return (
    <HelmetProvider>
      {!isHostedEmbed && <SEO />}
      {!isHostedEmbed && <ScrollToTop />}
      {!isHostedEmbed && !isApiDocs && <WhatsAppButton />}
      <ErrorBoundary>
        {isDeveloperHost ? <ApiDocsPage /> : <Outlet />}
      </ErrorBoundary>
    </HelmetProvider>
  )
}
