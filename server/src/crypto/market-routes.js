const COINGECKO_URL = 'https://api.coingecko.com/api/v3'

const HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'CryptoFolio/1.0',
}

// Simple in-memory cache
const cache = new Map()
const CACHE_TTL = 60_000 // 60 seconds

async function cachedFetch(key, url) {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data
  }

  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) {
    // If rate limited but we have stale cache, return it
    if (cached) return cached.data
    return null
  }

  const data = await res.json()
  cache.set(key, { data, time: Date.now() })
  return data
}

/**
 * @param {import('fastify').FastifyInstance} app
 */
function marketRoutes(app) {
  // GET /market/prices?ids=bitcoin,ethereum
  app.get('/prices', async (request, reply) => {
    const { ids } = request.query
    if (!ids) return reply.status(400).send({ error: 'ids requis' })

    const data = await cachedFetch(`prices:${ids}`, `${COINGECKO_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`)
    if (!data) return reply.status(502).send({ error: 'Erreur CoinGecko' })
    return reply.send(data)
  })

  // GET /market/search?query=bitcoin
  app.get('/search', async (request, reply) => {
    const { query } = request.query
    if (!query) return reply.status(400).send({ error: 'query requis' })

    const data = await cachedFetch(`search:${query}`, `${COINGECKO_URL}/search?query=${encodeURIComponent(query)}`)
    if (!data) return reply.status(502).send({ error: 'Erreur CoinGecko' })
    return reply.send(data)
  })

  // GET /market/coins — top 20
  app.get('/coins', async (request, reply) => {
    const data = await cachedFetch('coins', `${COINGECKO_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h,7d`)
    if (!data) return reply.status(502).send({ error: 'Erreur CoinGecko' })
    return reply.send(data)
  })

  // GET /market/history?id=bitcoin&days=30
  app.get('/history', async (request, reply) => {
    const { id, days = 30 } = request.query
    if (!id) return reply.status(400).send({ error: 'id requis' })

    const data = await cachedFetch(`history:${id}:${days}`, `${COINGECKO_URL}/coins/${id}/market_chart?vs_currency=usd&days=${days}`)
    if (!data) return reply.status(502).send({ error: 'Erreur CoinGecko' })
    return reply.send(data)
  })
}

export default marketRoutes
