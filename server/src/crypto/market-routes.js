const PAPRIKA_URL = 'https://api.coinpaprika.com/v1'
const COINGECKO_URL = 'https://api.coingecko.com/api/v3'

const HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'CryptoFolio/1.0',
}

// Simple in-memory cache
const cache = new Map()
const CACHE_TTL = 120_000 // 2 minutes

async function cachedFetch(key, url, ttl = CACHE_TTL) {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.time < ttl) {
    return cached.data
  }

  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) {
    if (cached) return cached.data
    return null
  }

  const data = await res.json()
  cache.set(key, { data, time: Date.now() })
  return data
}

// Map CoinGecko IDs to CoinPaprika IDs
const GECKO_TO_PAPRIKA = {
  bitcoin: 'btc-bitcoin',
  ethereum: 'eth-ethereum',
  solana: 'sol-solana',
  cardano: 'ada-cardano',
  ripple: 'xrp-xrp',
  polkadot: 'dot-polkadot',
  'avalanche-2': 'avax-avalanche',
  chainlink: 'link-chainlink',
  dogecoin: 'doge-dogecoin',
  'matic-network': 'matic-polygon',
  binancecoin: 'bnb-binance-coin',
  cosmos: 'atom-cosmos',
  hyperliquid: 'hype-hyperliquid',
}

function geckoToPaprikaId(geckoId) {
  return GECKO_TO_PAPRIKA[geckoId] || geckoId
}

/**
 * @param {import('fastify').FastifyInstance} app
 */
function marketRoutes(app) {
  // GET /market/prices?ids=bitcoin,ethereum (uses CoinGecko IDs)
  app.get('/prices', async (request, reply) => {
    const { ids } = request.query
    if (!ids) return reply.status(400).send({ error: 'ids requis' })

    const geckoIds = ids.split(',')
    const result = {}

    for (const geckoId of geckoIds) {
      const paprikaId = geckoToPaprikaId(geckoId.trim())
      const data = await cachedFetch(`ticker:${paprikaId}`, `${PAPRIKA_URL}/tickers/${paprikaId}`)
      if (data && data.quotes?.USD) {
        result[geckoId.trim()] = {
          usd: data.quotes.USD.price,
          usd_24h_change: data.quotes.USD.percent_change_24h,
          usd_market_cap: data.quotes.USD.market_cap,
        }
      }
    }

    return reply.send(result)
  })

  // GET /market/search?query=bitcoin
  app.get('/search', async (request, reply) => {
    const { query } = request.query
    if (!query) return reply.status(400).send({ error: 'query requis' })

    const data = await cachedFetch('coinlist', `${PAPRIKA_URL}/coins`, 600_000)
    if (!data) return reply.status(502).send({ error: 'Erreur API' })

    const q = query.toLowerCase()
    const results = data
      .filter(c => c.is_active && (c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)))
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        rank: c.rank,
      }))

    // Return in CoinGecko search format for compatibility
    return reply.send({ coins: results.map(c => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol,
      market_cap_rank: c.rank,
      thumb: `https://static.coinpaprika.com/coin/${c.id}/logo.png`,
    })) })
  })

  // GET /market/coins — top 20
  app.get('/coins', async (request, reply) => {
    const data = await cachedFetch('tickers', `${PAPRIKA_URL}/tickers?limit=20`)
    if (!data) return reply.status(502).send({ error: 'Erreur API' })

    const coins = data.map((c, i) => ({
      id: c.id,
      symbol: c.symbol.toLowerCase(),
      name: c.name,
      image: `https://static.coinpaprika.com/coin/${c.id}/logo.png`,
      current_price: c.quotes.USD.price,
      market_cap: c.quotes.USD.market_cap,
      market_cap_rank: c.rank,
      price_change_percentage_24h_in_currency: c.quotes.USD.percent_change_24h,
      price_change_percentage_7d_in_currency: c.quotes.USD.percent_change_7d,
      sparkline_in_7d: null,
    }))

    return reply.send(coins)
  })

  // GET /market/history?id=bitcoin&days=30
  app.get('/history', async (request, reply) => {
    const { id, days = 30 } = request.query
    if (!id) return reply.status(400).send({ error: 'id requis' })

    // Try CoinGecko first (works sometimes), fallback to CoinPaprika
    const paprikaId = geckoToPaprikaId(id)
    const now = new Date()
    const start = new Date(now - days * 24 * 60 * 60 * 1000)
    const startStr = start.toISOString().split('T')[0]
    const endStr = now.toISOString().split('T')[0]

    const data = await cachedFetch(
      `history:${paprikaId}:${days}`,
      `${PAPRIKA_URL}/coins/${paprikaId}/ohlcv/historical?start=${startStr}&end=${endStr}`,
      300_000,
    )

    if (!data || !Array.isArray(data)) {
      return reply.status(502).send({ error: 'Erreur API' })
    }

    // Return in CoinGecko format for compatibility
    const prices = data.map(d => [new Date(d.time_open).getTime(), d.close])
    return reply.send({ prices })
  })
}

export default marketRoutes
