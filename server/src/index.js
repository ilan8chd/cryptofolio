import { hash, verify } from 'node:crypto'

import process from 'node:process'
import buildApp from './app.js'
import config from './config.js'
import { hashPassword, verifyPassword } from './utils/crypto.js'

async function start() {
  const app = await buildApp()
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
