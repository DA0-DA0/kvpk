import { RequestHandler, json } from 'itty-router'

import { ArrayRemoveRequest, AuthorizedRequest, GetResponse } from '../types'
import { kvGet, kvSet } from '../utils'

export const arrayRemove: RequestHandler<
  AuthorizedRequest<ArrayRemoveRequest>
> = async (request, env: Env): Promise<GetResponse> => {
  const { key, index } = request.data
  if (!key) {
    throw json({ error: 'Empty key.' }, { status: 400 })
  }

  // Get the current value of the array.
  let array = await kvGet(env, {
    uuid: request.uuid,
    key,
  })

  if (array === null) {
    throw json({ error: 'Key does not exist.' }, { status: 404 })
  }

  if (!Array.isArray(array)) {
    throw json({ error: 'Key has a non-array value.' }, { status: 400 })
  }

  if (index < 0 || index >= array.length) {
    throw json({ error: 'Index is out of bounds.' }, { status: 400 })
  }

  array.splice(index, 1)

  // Save the array
  await kvSet(env, {
    uuid: request.uuid,
    key,
    value: array,
  })

  return {
    key,
    value: array,
  }
}
