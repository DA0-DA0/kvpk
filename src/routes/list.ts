import { RequestHandler, json } from 'itty-router'

import { ListResponse } from '../types'
import { kvList } from '../utils'

export const list: RequestHandler = async (
  request,
  env: Env
): Promise<ListResponse> => {
  const { uuid, prefix } = request.params || {}

  if (!uuid) {
    throw json({ error: 'Missing UUID.' }, { status: 400 })
  }
  if (!prefix) {
    throw json({ error: 'Missing prefix.' }, { status: 400 })
  }

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
