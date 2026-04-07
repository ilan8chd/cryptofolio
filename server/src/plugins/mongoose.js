import fp from 'fastify-plugin'
import mongoose from 'mongoose'

import config from '../config.js'

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
async function mongoosePlugin(fastify) {
  fastify.log.info(`Connecting to MongoDB...`)

  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
  })
  fastify.log.info('Connected to MongoDB')

  fastify.addHook('onClose', async () => {
    await mongoose.connection.close()
  })
}

export default fp(mongoosePlugin)
