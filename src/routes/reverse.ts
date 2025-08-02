import { RequestHandler } from 'itty-router'

import { ReverseResponse } from '../types'
import { kvReverse } from '../utils'

export const reverse: RequestHandler = async (
  request,
  env: Env
): Promise<ReverseResponse> => {
  const { key } = request.params

  const limit = request.query.limit ? Number(request.query.limit) : undefined

  const items = await kvReverse(env, {
    key,
    limit,
  })

  return {
    items,
  }
}
