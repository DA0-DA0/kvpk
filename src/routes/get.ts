import { json, RequestHandler } from 'itty-router'

import { keyForUuid } from '../utils'
import { GetResponse } from '../types'

export const get: RequestHandler = async (
  request,
  { DATA }: Env
): Promise<GetResponse> => {
  const { uuid, key } = request.params || {}

  if (!uuid) {
    throw json({ error: 'Missing UUID.' }, { status: 400 })
  }
  if (!key) {
    throw json({ error: 'Missing key.' }, { status: 400 })
  }

  const stringifiedValue = await DATA.get(keyForUuid(uuid, key))
  const value = stringifiedValue ? JSON.parse(stringifiedValue) : null

  return {
    key,
    value,
  }
}
