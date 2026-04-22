import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logVisit } from '@/api/apiEndpoints';
import { sourceTracker } from '@/lib/utils/sourceTracker';

export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Check cookie first
    let source = sourceTracker.getSource();
    
    // If no cookie, try to get from URL directly (handles initial hit race condition)
    if (!source) {
      const params = new URLSearchParams(window.location.search);
      source = params.get('source') || params.get('utm_source') || undefined;
      
      // If still no source but there's a ref, count as referral
      if (!source && params.get('ref')) {
        source = 'referral';
      }
    }

    logVisit(location.pathname, source);
  }, [location.pathname]);


  return null;
}

