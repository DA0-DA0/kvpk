import { RequestHandler } from 'itty-router'

import { GetResponse } from '../types'
import { kvGet } from '../utils'

export const get: RequestHandler = async (
  request,
  env: Env
): Promise<GetResponse> => {
  const { uuid, key } = request.params

  const value = await kvGet(env, { uuid, key })

  return {
    key,
    value,
  }
}
