import { RequestHandler, json } from 'itty-router'

import { AuthorizedRequest, SetRequest } from '../types'
import { kvSet, kvUnset } from '../utils'

export const set: RequestHandler<AuthorizedRequest<SetRequest>> = async (
  request,
  env: Env
): Promise<Response> => {
  if (!request.data.key || request.data.value === undefined) {
    return json({ error: 'Empty key or value.' }, { status: 400 })
  }

  // If value is null, delete the key.
  if (request.data.value === null) {
    await kvUnset(env, { uuid: request.uuid, key: request.data.key })
  }
  // Otherwise, set it.
  else {
    await kvSet(env, {
      uuid: request.uuid,
      key: request.data.key,
      value: request.data.value,
    })
  }

  return new Response(null, { status: 204 })
}
