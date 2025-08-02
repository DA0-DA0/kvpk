import { Router, cors, json } from 'itty-router'

import { authMiddleware } from './auth'
import { arrayInsert } from './routes/arrayInsert'
import { arrayRemove } from './routes/arrayRemove'
import { get } from './routes/get'
import { list } from './routes/list'
import { reverse } from './routes/reverse'
import { set } from './routes/set'
import { setMany } from './routes/setMany'

// Create CORS handlers.
const { preflight, corsify } = cors({
  allowMethods: ['GET', 'POST'],
  maxAge: 3600,
  exposeHeaders: ['Content-Type'],
})

const router = Router()
  // Handle CORS preflight.
  .all('*', preflight)
  //! Unauthenticated routes.
  // Get value.
  .get('/get/:uuid/:key', get)
  // List keys with prefix set for a given UUID.
  .get('/list/:uuid/:prefix', list)
  // List UUIDs that have a key set.
  .get('/reverse/:key', reverse)
  //! Authenticated routes.
  // Set value.
  .post('/set', authMiddleware, set)
  // Set many values.
  .post('/setMany', authMiddleware, setMany)
  // Insert into array.
  .post('/arrayInsert', authMiddleware, arrayInsert)
  // Remove from array.
  .post('/arrayRemove', authMiddleware, arrayRemove)
  //! 404
  .all('*', () => json({ error: 'Not found' }, { status: 404 }))

//! Entrypoint.
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return router
      .fetch(request, env, ctx)
      .then(json)
      .catch((err) => {
        if (err instanceof Response) {
          return err
        }

        console.error('Unknown error', err)

        return json(
          {
            error:
              'Unknown error occurred: ' +
              (err instanceof Error ? err.message : `${err}`),
          },
          { status: 500 }
        )
      })
      .then(corsify)
  },
}
