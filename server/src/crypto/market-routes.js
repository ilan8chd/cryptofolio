const COINGECKO_URL = 'https://api.coingecko.com/api/v3'

/**
 * @param {import('fastify').FastifyInstance} app
 */
function marketRoutes(app) {
  // GET /market/prices?ids=bitcoin,ethereum
  app.get('/prices', async (request, reply) => {
    const { ids } = request.query
    if (!ids) return reply.status(400).send({ error: 'ids requis' })

    const url = `${COINGECKO_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
    const res = await fetch(url)
    if (!res.ok) return reply.status(res.status).send({ error: 'Erreur CoinGecko' })
    const data = await res.json()
    return reply.send(data)
  })

  // GET /market/search?query=bitcoin
  app.get('/search', async (request, reply) => {
    const { query } = request.query
    if (!query) return reply.status(400).send({ error: 'query requis' })

    const url = `${COINGECKO_URL}/search?query=${encodeURIComponent(query)}`
    const res = await fetch(url)
    if (!res.ok) return reply.status(res.status).send({ error: 'Erreur CoinGecko' })
    const data = await res.json()
    return reply.send(data)
  })

  // GET /market/coins — top 20
  app.get('/coins', async (request, reply) => {
    const url = `${COINGECKO_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h,7d`
    const res = await fetch(url)
    if (!res.ok) return reply.status(res.status).send({ error: 'Erreur CoinGecko' })
    const data = await res.json()
    return reply.send(data)
  })

  // GET /market/history?id=bitcoin&days=30
  app.get('/history', async (request, reply) => {
    const { id, days = 30 } = request.query
    if (!id) return reply.status(400).send({ error: 'id requis' })

    const url = `${COINGECKO_URL}/coins/${id}/market_chart?vs_currency=usd&days=${days}`
    const res = await fetch(url)
    if (!res.ok) return reply.status(res.status).send({ error: 'Erreur CoinGecko' })
    const data = await res.json()
    return reply.send(data)
  })
}

export default marketRoutes
