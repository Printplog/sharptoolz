import Cookies from 'js-cookie';

const SOURCE_COOKIE_KEY = 'traffic_source';
const ATTRIBUTION_COOKIE_KEY = 'traffic_attribution';

export type TrafficAttribution = {
  source: string;
  medium: string;
  campaign?: string | null;
  term?: string | null;
  content?: string | null;
  source_platform?: string | null;
  initial_referrer?: string | null;
  channel_group?: string | null;
  is_custom_source?: boolean;
};

const cleanValue = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const deriveChannelGroup = (source?: string, medium?: string) => {
  const normalizedSource = (source || '').toLowerCase();
  const normalizedMedium = (medium || '').toLowerCase();

  if (normalizedSource === 'direct' || normalizedMedium === '(none)') return 'Direct';
  if (normalizedMedium === 'organic') return 'Organic Search';
  if (normalizedMedium === 'social') return 'Organic Social';
  if (normalizedMedium === 'paid_social') return 'Paid Social';
  if (['cpc', 'ppc', 'paid_search', 'paidsearch'].includes(normalizedMedium)) return 'Paid Search';
  if (normalizedMedium === 'email') return 'Email';
  if (normalizedMedium === 'affiliate') return 'Affiliate';
  if (normalizedMedium === 'display') return 'Display';
  if (normalizedMedium === 'referral') return 'Referral';
  if (normalizedMedium === 'custom') return 'Custom Campaign';
  return 'Unassigned';
};

const classifyReferrer = (referrer: string) => {
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host === window.location.hostname || host.endsWith(`.${window.location.hostname}`)) {
      return undefined;
    }
    if (host.includes('google.')) {
      return { source: 'google', medium: 'organic', channel_group: 'Organic Search' };
    }
    if (host.includes('bing.')) {
      return { source: 'bing', medium: 'organic', channel_group: 'Organic Search' };
    }
    if (host.includes('duckduckgo.')) {
      return { source: 'duckduckgo', medium: 'organic', channel_group: 'Organic Search' };
    }
    if (host.includes('search.yahoo.')) {
      return { source: 'yahoo', medium: 'organic', channel_group: 'Organic Search' };
    }
    if (host.includes('yandex.')) {
      return { source: 'yandex', medium: 'organic', channel_group: 'Organic Search' };
    }
    if (host.includes('baidu.')) {
      return { source: 'baidu', medium: 'organic', channel_group: 'Organic Search' };
    }
    if (host.includes('facebook.com') || host.includes('fb.')) {
      return { source: 'facebook', medium: 'social', channel_group: 'Organic Social' };
    }
    if (host.includes('instagram.com')) {
      return { source: 'instagram', medium: 'social', channel_group: 'Organic Social' };
    }
    if (host.includes('linkedin.com')) {
      return { source: 'linkedin', medium: 'social', channel_group: 'Organic Social' };
    }
    if (host.includes('twitter.com') || host === 'x.com' || host.includes('t.co')) {
      return { source: 'x', medium: 'social', channel_group: 'Organic Social' };
    }
    if (host.includes('reddit.com')) {
      return { source: 'reddit', medium: 'social', channel_group: 'Organic Social' };
    }
    if (host.includes('tiktok.com')) {
      return { source: 'tiktok', medium: 'social', channel_group: 'Organic Social' };
    }
    if (host.includes('pinterest.com')) {
      return { source: 'pinterest', medium: 'social', channel_group: 'Organic Social' };
    }
    if (host.includes('youtube.com')) {
      return { source: 'youtube', medium: 'social', channel_group: 'Organic Social' };
    }
    return { source: host, medium: 'referral', channel_group: 'Referral' };
  } catch {
    return undefined;
  }
};

const readAttributionCookie = (): TrafficAttribution | undefined => {
  const raw = Cookies.get(ATTRIBUTION_COOKIE_KEY);
  if (!raw) return undefined;

  try {
    return JSON.parse(raw) as TrafficAttribution;
  } catch {
    return undefined;
  }
};

export const sourceTracker = {
  /**
   * Captures landing attribution and persists it for later page views and signup attribution.
   */
  captureSource: () => {
    const params = new URLSearchParams(window.location.search);
    const explicitSource = cleanValue(params.get('source'));
    const utmSource = cleanValue(params.get('utm_source'));
    const source = explicitSource || utmSource;
    const medium = cleanValue(params.get('medium')) || cleanValue(params.get('utm_medium'));
    const campaign = cleanValue(params.get('campaign')) || cleanValue(params.get('utm_campaign'));
    const term = cleanValue(params.get('utm_term'));
    const content = cleanValue(params.get('utm_content'));
    const sourcePlatform = cleanValue(params.get('utm_source_platform'));
    const ref = params.get('ref');

    let attribution: TrafficAttribution | undefined;

    if (source) {
      attribution = {
        source: source.toLowerCase(),
        medium: (medium || (explicitSource ? 'custom' : '(not set)')).toLowerCase(),
        campaign: campaign || null,
        term: term || null,
        content: content || null,
        source_platform: sourcePlatform || null,
        initial_referrer: cleanValue(document.referrer) || null,
        is_custom_source: Boolean(explicitSource && !utmSource),
      };
    } else if (document.referrer) {
      const inferred = classifyReferrer(document.referrer);
      if (inferred) {
        attribution = {
          ...inferred,
          initial_referrer: document.referrer,
        };
      }
    } else if (ref && !readAttributionCookie()) {
      attribution = {
        source: 'referral',
        medium: 'referral',
        campaign: null,
        initial_referrer: null,
      };
    } else if (!readAttributionCookie()) {
      attribution = {
        source: 'direct',
        medium: '(none)',
        initial_referrer: null,
      };
    }

    if (!attribution) return;

    attribution.channel_group = deriveChannelGroup(attribution.source, attribution.medium);

    Cookies.set(SOURCE_COOKIE_KEY, attribution.source, { expires: 30, sameSite: 'lax' });
    Cookies.set(ATTRIBUTION_COOKIE_KEY, JSON.stringify(attribution), { expires: 30, sameSite: 'lax' });
  },

  /**
   * Retrieves the current source from cookies.
   */
  getSource: () => {
    return readAttributionCookie()?.source || Cookies.get(SOURCE_COOKIE_KEY);
  },

  getAttribution: (): TrafficAttribution | undefined => {
    return readAttributionCookie();
  },

  /**
   * Clears the source cookie (e.g. after successful registration if desired).
   */
  clearSource: () => {
    Cookies.remove(SOURCE_COOKIE_KEY);
    Cookies.remove(ATTRIBUTION_COOKIE_KEY);
  }
};
