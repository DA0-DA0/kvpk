import { json, RequestHandler } from 'itty-router'
import { AuthorizedRequest, SetRequest } from '../types'
import { del, put } from '../utils'

export const set: RequestHandler<AuthorizedRequest<SetRequest>> = async (
  request,
  env: Env
): Promise<Response> => {
  if (!request.data.key || request.data.value === undefined) {
    return json({ error: 'Empty key or value.' }, { status: 400 })
  }

  // If value is null, delete the key.
  if (request.data.value === null) {
    await del(env, request.uuid, request.data.key)
  }
  // Otherwise, set it.
  else {
    await put(env, request.uuid, request.data.key, request.data.value)
  }

  return new Response(null, { status: 204 })
}
