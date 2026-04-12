const PAPRIKA_URL = 'https://api.coinpaprika.com/v1'
const CRYPTOCOMPARE_URL = 'https://min-api.cryptocompare.com/data'

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

// Map coin IDs to symbols for CryptoCompare
const ID_TO_SYMBOL = {
  bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', cardano: 'ADA',
  ripple: 'XRP', polkadot: 'DOT', 'avalanche-2': 'AVAX', chainlink: 'LINK',
  dogecoin: 'DOGE', 'matic-network': 'MATIC', binancecoin: 'BNB', cosmos: 'ATOM',
  hyperliquid: 'HYPE',
}

// Map CoinGecko IDs to CoinPaprika IDs
const GECKO_TO_PAPRIKA = {
  bitcoin: 'btc-bitcoin', ethereum: 'eth-ethereum', solana: 'sol-solana',
  cardano: 'ada-cardano', ripple: 'xrp-xrp', polkadot: 'dot-polkadot',
  'avalanche-2': 'avax-avalanche', chainlink: 'link-chainlink',
  dogecoin: 'doge-dogecoin', 'matic-network': 'matic-polygon',
  binancecoin: 'bnb-binance-coin', cosmos: 'atom-cosmos', hyperliquid: 'hype-hyperliquid',
}

function geckoToPaprikaId(geckoId) {
  return GECKO_TO_PAPRIKA[geckoId] || geckoId
}

function idToSymbol(id) {
  if (ID_TO_SYMBOL[id]) return ID_TO_SYMBOL[id]
  // CoinPaprika IDs like "btc-bitcoin" -> extract symbol
  const parts = id.split('-')
  return parts[0].toUpperCase()
}

/**
 * @param {import('fastify').FastifyInstance} app
 */
function marketRoutes(app) {
  // GET /market/prices?ids=bitcoin,ethereum
  app.get('/prices', async (request, reply) => {
    const { ids } = request.query
    if (!ids) return reply.status(400).send({ error: 'ids requis' })

    const idList = ids.split(',').map(s => s.trim())
    const symbols = idList.map(idToSymbol).join(',')

    const data = await cachedFetch(
      `prices:${symbols}`,
      `${CRYPTOCOMPARE_URL}/pricemultifull?fsyms=${symbols}&tsyms=USD`,
    )

    if (!data?.RAW) {
      // Fallback to CoinPaprika
      const result = {}
      for (const geckoId of idList) {
        const paprikaId = geckoToPaprikaId(geckoId)
        const tickerData = await cachedFetch(`ticker:${paprikaId}`, `${PAPRIKA_URL}/tickers/${paprikaId}`)
        if (tickerData?.quotes?.USD) {
          result[geckoId] = {
            usd: tickerData.quotes.USD.price,
            usd_24h_change: tickerData.quotes.USD.percent_change_24h,
            usd_market_cap: tickerData.quotes.USD.market_cap,
          }
        }
      }
      return reply.send(result)
    }

    const result = {}
    for (const geckoId of idList) {
      const sym = idToSymbol(geckoId)
      if (data.RAW[sym]?.USD) {
        const d = data.RAW[sym].USD
        result[geckoId] = {
          usd: d.PRICE,
          usd_24h_change: d.CHANGEPCT24HOUR,
          usd_market_cap: d.MKTCAP,
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

    const coins = data.map(c => ({
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

    const sym = idToSymbol(id)
    const limit = Math.min(Number(days), 365)

    // Use hourly data for <= 7 days, daily for longer
    const endpoint = limit <= 7 ? 'v2/histohour' : 'v2/histoday'
    const dataLimit = limit <= 7 ? limit * 24 : limit

    const data = await cachedFetch(
      `history:${sym}:${days}`,
      `${CRYPTOCOMPARE_URL}/${endpoint}?fsym=${sym}&tsym=USD&limit=${dataLimit}`,
      300_000,
    )

    if (!data?.Data?.Data) {
      return reply.status(502).send({ error: 'Erreur API' })
    }

    const prices = data.Data.Data.map(d => [d.time * 1000, d.close])
    return reply.send({ prices })
  })
}

export default marketRoutes
