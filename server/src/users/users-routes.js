import User from './user-schema.js'

/**
 *
 * @param {import('fastify').FastifyInstance} app
 */
function usersRoutes(app) {
  app.get('/verify-email', async (request, reply) => {
    const { token } = request.query

    // Valider la présence du token
    if (!token) {
      return reply.status(400).send({ error: 'Token de validation requis' })
    }

    // Rechercher l'utilisateur correspondant au token de validation
    const user = await User.findOne({ validationToken: token })

    // Gérer le cas où le token est invalide ou expiré
    if (!user) {
      return reply.status(404).send({ error: 'Token invalide ou expiré' })
    }

    // Vérifier si l'utilisateur a déjà validé son email
    if (user.emailVerified) {
      return reply.status(409).send({ error: 'Email déjà vérifié' })
    }

    // Marquer l'email comme vérifié et supprimer le token
    user.emailVerified = true
    user.validationToken = null
    await user.save()

    return reply.send({ message: 'Email vérifié avec succès' })
  })

  app.get('/me', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    return reply.send({ user: request.user })
  })

  // Routes protégées par authentification
  app.get('', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const { sort = '-createdAt', limit = 20, skip = 0 } = request.query
    const users = await User.find()
      .select('-passwordHash -validationToken')
      .sort(sort)
      .skip(Number(skip))
      .limit(Number(limit))
    const total = await User.countDocuments()
    return reply.send({ users, total })
  })

  app.get('/:id', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params
    const user = await User.findById(id).select('-passwordHash -validationToken')
    if (!user) {
      return reply.status(404).send({ error: 'Utilisateur introuvable' })
    }
    return reply.send({ user })
  })

  app.delete('/:id', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params
    const user = await User.findByIdAndDelete(id)
    if (!user) {
      return reply.status(404).send({ error: 'Utilisateur introuvable' })
    }
    return reply.send({ message: 'Utilisateur supprimé' })
  })
}

export default usersRoutes
