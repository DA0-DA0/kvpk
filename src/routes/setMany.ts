import { RequestHandler, json } from 'itty-router'

import { AuthorizedRequest, SetManyRequest } from '../types'
import { kvSet, kvUnset } from '../utils'

export const setMany: RequestHandler<
  AuthorizedRequest<SetManyRequest>
> = async (request, env: Env): Promise<Response> => {
  if (
    !request.data.items ||
    !Array.isArray(request.data.items) ||
    request.data.items.length === 0 ||
    request.data.items.some(
      (item) => !item || !item.key || item.value === undefined
    )
  ) {
    return json({ error: 'Invalid items.' }, { status: 400 })
  }

  await Promise.all(
    request.data.items.map(async ({ key, value }) => {
      // If value is null, delete the key.
      if (value === null) {
        await kvUnset(env, { uuid: request.uuid, key })
      }
      // Otherwise, set it.
      else {
        await kvSet(env, { uuid: request.uuid, key, value })
      }
    })
  )

  return new Response(null, { status: 204 })
}
