import { RequestHandler, json } from 'itty-router'

import { ArrayInsertRequest, AuthorizedRequest, GetResponse } from '../types'
import { kvGet, kvSet } from '../utils'

export const arrayInsert: RequestHandler<
  AuthorizedRequest<ArrayInsertRequest>
> = async (request, env: Env): Promise<GetResponse> => {
  const { key, value, index } = request.data
  if (!key || value === undefined) {
    throw json({ error: 'Empty key or value.' }, { status: 400 })
  }

  // Get the current value of the array.
  let array = await kvGet(env, {
    uuid: request.uuid,
    key,
  })

  if (!array) {
    array = []
  } else if (!Array.isArray(array)) {
    throw json({ error: 'Key has a non-array value.' }, { status: 400 })
  }

  if (index !== undefined) {
    if (index < 0 || index > array.length) {
      throw json({ error: 'Index is out of bounds.' }, { status: 400 })
    }

    array.splice(index, 0, value)
  } else {
    array.push(value)
  }

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
