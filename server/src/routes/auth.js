function authRoutes(app) { // Route d'inscription
  app.post('/auth/register', async (request, reply) => {
    const { email, password } = request.body

    // Validation basique
    if (!email || !password) {
      return reply.status(400).send({ error: 'Email et password requis' })
    }

    // TODO: Implémenter la logique d'inscription
    // - Valider l'email
    // - Hasher le password
    // - Sauvegarder en base de données

    return reply.status(201).send({ message: 'Utilisateur créé', email })
  })

  // Route de connexion
  app.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email et password requis' })
    }

    // TODO: Implémenter la logique de login
    // - Vérifier l'existence de l'utilisateur
    // - Vérifier le password
    // - Générer un JWT token

    return reply.send({ message: 'Authentification réussie', token: 'TODO' })
  })
}

export default authRoutes
