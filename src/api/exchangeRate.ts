/** Admin USDT rate is the source of truth — no live fetch. */
export async function fetchUsdToNgn(fallbackRate = 1650): Promise<number> {
    const rate = Number(fallbackRate);
    return rate > 0 ? rate : 1650;
}
