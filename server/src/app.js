import Fastify from 'fastify'

import config from './config.js'
import envToLogger from './logger.js'
import mongoosePlugin from './plugins/mongoose.js'
import authRoutes from './routes/auth.js'
import rootRoutes from './routes/root.js'

async function buildApp() {
  const fastify = Fastify({
    logger: envToLogger[config.env] ?? true,
  })

  await fastify.register(mongoosePlugin)
  fastify.register(authRoutes, { prefix: '/auth' })
  fastify.register(rootRoutes)

  return fastify
}

export default buildApp
