/**
 * Fetches the live USD → NGN exchange rate from a free public API.
 * Returns the admin override rate as fallback.
 */
export async function fetchUsdToNgn(fallbackRate = 1650): Promise<number> {
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD', {
            cache: 'force-cache',
        });
        if (!res.ok) throw new Error('Rate fetch failed');
        const json = await res.json();
        const rate = json?.rates?.NGN;
        if (typeof rate === 'number' && rate > 0) return rate;
        return fallbackRate;
    } catch {
        return fallbackRate;
    }
}
