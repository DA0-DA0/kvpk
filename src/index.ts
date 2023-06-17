import { createCors } from 'itty-cors'
import { Router } from 'itty-router'

import { Env } from './types'
import { authMiddleware } from './auth'
import { handleNonce } from './routes/nonce'
import { respondError } from './utils'
import { set } from './routes/set'
import { setMany } from './routes/setMany'
import { get } from './routes/get'
import { list } from './routes/list'

// Create CORS handlers.
const { preflight, corsify } = createCors({
  methods: ['GET', 'POST'],
  origins: ['*'],
  maxAge: 3600,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  },
})

const router = Router()

// Handle CORS preflight.
router.all('*', preflight)

//! Unauthenticated routes.

// Get nonce for publicKey.
router.get('/nonce/:publicKey', handleNonce)

// Get value.
router.get('/get/:publicKey/:key', get)

// List keys with prefix.
router.get('/list/:publicKey/:prefix', list)

//! Authenticated routes.

// Set value.
router.post('/set', authMiddleware, set)

// Set many values.
router.post('/setMany', authMiddleware, setMany)

//! 404
router.all('*', () => respondError(404, 'Not found'))

//! Entrypoint.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return router
      .handle(request, env)
      .catch((err) => {
        console.error('Error handling request', request.url, err)
        return respondError(
          500,
          `Internal server error. ${
            err instanceof Error ? err.message : `${JSON.stringify(err)}`
          }`
        )
      })
      .then(corsify)
  },
}
