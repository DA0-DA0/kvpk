import { RequestHandler, json } from 'itty-router'

import { GetResponse } from '../types'
import { kvGet } from '../utils'

export const get: RequestHandler = async (
  request,
  env: Env
): Promise<GetResponse> => {
  const { uuid, key } = request.params || {}

  if (!uuid) {
    throw json({ error: 'Missing UUID.' }, { status: 400 })
  }
  if (!key) {
    throw json({ error: 'Missing key.' }, { status: 400 })
  }

  const value = await kvGet(env, { uuid, key })

  return {
    key,
    value,
  }
}
