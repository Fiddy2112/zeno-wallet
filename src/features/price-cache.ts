const TTL_MS = 60_000

/**
 * Get cached price
 * @param coingeckoId CoinGecko ID
 * @returns Price
 */
export const getCachedPrice = async (coingeckoId: string): Promise<number> => {
  const cacheKey = `zeno_price_${coingeckoId}`

  try {
    const cached = await chrome.storage.local.get([cacheKey])
    const entry = cached[cacheKey]
    const now = Date.now()

    // Return cached value if still fresh
    if (entry && now - entry.timestamp < TTL_MS) {
      return entry.price
    }

    // Fetch fresh price
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true`
    )

    if (!res.ok) {
      // Rate limited or error — return stale cache if available
      if (entry?.price) return entry.price
      return 0
    }

    const data = await res.json()
    const price = data[coingeckoId]?.usd || 0
    const change24h = data[coingeckoId]?.usd_24h_change || 0

    // Save to cache with both price and 24h change
    await chrome.storage.local.set({
      [cacheKey]: { price, change24h, timestamp: now }
    })

    return price
  } catch {
    // On any error, try stale cache
    try {
      const cached = await chrome.storage.local.get([
        `zeno_price_${coingeckoId}`
      ])
      return cached[`zeno_price_${coingeckoId}`]?.price || 0
    } catch {
      return 0
    }
  }
}

export const getCachedPriceWithChange = async (
  coingeckoId: string
): Promise<{ price: number; change24h: number }> => {
  const cacheKey = `zeno_price_${coingeckoId}`

  try {
    const cached = await chrome.storage.local.get([cacheKey])
    const entry = cached[cacheKey]
    const now = Date.now()

    if (entry && now - entry.timestamp < TTL_MS) {
      return { price: entry.price || 0, change24h: entry.change24h || 0 }
    }

    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true`
    )

    if (!res.ok) {
      if (entry)
        return { price: entry.price || 0, change24h: entry.change24h || 0 }
      return { price: 0, change24h: 0 }
    }

    const data = await res.json()
    const price = data[coingeckoId]?.usd || 0
    const change24h = data[coingeckoId]?.usd_24h_change || 0

    await chrome.storage.local.set({
      [cacheKey]: { price, change24h, timestamp: now }
    })

    return { price, change24h }
  } catch {
    try {
      const cached = await chrome.storage.local.get([
        `zeno_price_${coingeckoId}`
      ])
      const entry = cached[`zeno_price_${coingeckoId}`]
      return { price: entry?.price || 0, change24h: entry?.change24h || 0 }
    } catch {
      return { price: 0, change24h: 0 }
    }
  }
}
