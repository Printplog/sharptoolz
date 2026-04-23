import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logVisit } from '@/api/apiEndpoints';
import { sourceTracker } from '@/lib/utils/sourceTracker';

export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Check cookie first
    let source = sourceTracker.getSource();
    
    // If no URL source, try to detect from Referrer (The Universal Standard)
    if (!source && document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        const host = referrerUrl.hostname.toLowerCase();
        
        // Skip if from our own domain
        if (!host.includes(window.location.hostname)) {
          if (host.includes('google')) source = 'Search (Google)';
          else if (host.includes('facebook') || host.includes('fb.')) source = 'Social (Facebook)';
          else if (host.includes('twitter') || host.includes('t.co')) source = 'Social (Twitter/X)';
          else if (host.includes('linkedin')) source = 'Social (LinkedIn)';
          else if (host.includes('instagram')) source = 'Social (Instagram)';
          else if (host.includes('duckduckgo')) source = 'Search (DuckDuckGo)';
          else if (host.includes('bing')) source = 'Search (Bing)';
          else source = `Referral (${host})`;
        }
      } catch (e) {
        // Invalid URL in referrer, ignore
      }
    }

    logVisit(location.pathname, source);

  }, [location.pathname]);


  return null;
}

