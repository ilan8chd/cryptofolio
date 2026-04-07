import Asset from './asset-schema.js'

/**
 * @param {import('fastify').FastifyInstance} app
 */
function assetsRoutes(app) {
  // GET /assets — Récupérer tous les assets
  app.get('', async (request, reply) => {
    const { sort = '-purchaseDate', limit = 50, skip = 0 } = request.query
    const assets = await Asset.find()
      .sort(sort)
      .skip(Number(skip))
      .limit(Number(limit))
    const total = await Asset.countDocuments()
    return reply.send({ assets, total })
  })

  // GET /assets/:id — Récupérer un asset par ID
  app.get('/:id', async (request, reply) => {
    const { id } = request.params
    const asset = await Asset.findById(id)
    if (!asset) {
      return reply.status(404).send({ error: 'Asset introuvable' })
    }
    return reply.send({ asset })
  })

  // POST /assets — Créer un nouvel asset
  app.post('', async (request, reply) => {
    const { name, symbol, coinGeckoId, quantity, purchasePrice, purchaseDate } = request.body

    if (!name || !symbol || quantity == null || purchasePrice == null) {
      return reply.status(400).send({ error: 'name, symbol, quantity et purchasePrice sont requis' })
    }

    if (quantity <= 0 || purchasePrice <= 0) {
      return reply.status(400).send({ error: 'quantity et purchasePrice doivent être positifs' })
    }

    const asset = await Asset.create({
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      coinGeckoId: coinGeckoId || null,
      quantity: Number(quantity),
      purchasePrice: Number(purchasePrice),
      purchaseDate: purchaseDate || Date.now(),
    })

    return reply.status(201).send({ asset })
  })

  // PUT /assets/:id — Modifier un asset
  app.put('/:id', async (request, reply) => {
    const { id } = request.params
    const { name, symbol, quantity, purchasePrice, purchaseDate } = request.body

    const asset = await Asset.findById(id)
    if (!asset) {
      return reply.status(404).send({ error: 'Asset introuvable' })
    }

    if (name) asset.name = name.trim()
    if (symbol) asset.symbol = symbol.trim().toUpperCase()
    if (quantity != null) asset.quantity = Number(quantity)
    if (purchasePrice != null) asset.purchasePrice = Number(purchasePrice)
    if (purchaseDate) asset.purchaseDate = purchaseDate

    await asset.save()
    return reply.send({ asset })
  })

  // DELETE /assets/:id — Supprimer un asset
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params
    const asset = await Asset.findByIdAndDelete(id)
    if (!asset) {
      return reply.status(404).send({ error: 'Asset introuvable' })
    }
    return reply.send({ message: 'Asset supprimé' })
  })
}

export default assetsRoutes
