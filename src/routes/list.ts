import { RequestHandler } from 'itty-router'

import { ListResponse } from '../types'
import { kvList } from '../utils'

export const list: RequestHandler = async (
  request,
  env: Env
): Promise<ListResponse> => {
  const { uuid, prefix } = request.params

  const limit = request.query.limit ? Number(request.query.limit) : undefined

  const items = await kvList(env, {
    uuid,
    prefix,
    limit,
  })

  return {
    items,
  }
}
