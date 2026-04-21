import Cookies from 'js-cookie';

const SOURCE_COOKIE_KEY = 'traffic_source';

export const sourceTracker = {
  /**
   * Captures source from URL and saves to cookie if present.
   * Also handles the hardcoded 'referral' source if ref is present but no source is.
   */
  captureSource: () => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('source') || params.get('utm_source');
    const ref = params.get('ref');

    if (source) {
      // Save for 30 days
      Cookies.set(SOURCE_COOKIE_KEY, source, { expires: 30, sameSite: 'lax' });
    } else if (ref && !Cookies.get(SOURCE_COOKIE_KEY)) {
      // If there's a referral link but no explicit source, mark as 'referral'
      // only if we don't already have a source cookie.
      Cookies.set(SOURCE_COOKIE_KEY, 'referral', { expires: 30, sameSite: 'lax' });
    }
  },

  /**
   * Retrieves the current source from cookies.
   */
  getSource: () => {
    return Cookies.get(SOURCE_COOKIE_KEY);
  },

  /**
   * Clears the source cookie (e.g. after successful registration if desired).
   */
  clearSource: () => {
    Cookies.remove(SOURCE_COOKIE_KEY);
  }
};
