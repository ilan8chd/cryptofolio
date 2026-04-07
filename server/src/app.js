import Fastify from 'fastify'
import cors from '@fastify/cors'

import config from './config.js'
import assetsRoutes from './crypto/assets-routes.js'
import envToLogger from './logger.js'
import authPlugin from './plugins/auth.js'
import mongoosePlugin from './plugins/mongoose.js'
import rootRoutes from './rootRoute.js'
import authRoutes from './users/auth-routes.js'
import usersRoutes from './users/users-routes.js'

async function buildApp() {
  const fastify = Fastify({
    logger: envToLogger[config.env] ?? true,
    pluginTimeout: 30000,
  })

  await fastify.register(cors, {
    origin: config.env === 'production' ? config.appBaseUrl : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
  await fastify.register(authPlugin)
  await fastify.register(mongoosePlugin)
  fastify.register(authRoutes, { prefix: '/auth' })
  fastify.register(usersRoutes, { prefix: '/users' })
  fastify.register(assetsRoutes, { prefix: '/assets' })
  fastify.register(rootRoutes)

  return fastify
}

export default buildApp
