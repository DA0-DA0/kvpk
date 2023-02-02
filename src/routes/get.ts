import { Request as IttyRequest } from 'itty-router'

import { Env } from '../types'
import { keyForPk, respond, respondError } from '../utils'

export const get = async (
  request: IttyRequest,
  { DATA }: Env
): Promise<Response> => {
  const publicKey = request.params?.publicKey
  if (!publicKey) {
    return respondError(400, 'Missing publicKey.')
  }

  const key = request.params?.key
  if (!key) {
    return respondError(400, 'Missing key.')
  }

  const stringifiedValue = await DATA.get(keyForPk(publicKey, key))
  const value = stringifiedValue ? JSON.parse(stringifiedValue) : null

  return respond(200, {
    key,
    value,
  })
}
