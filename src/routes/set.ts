import { AuthorizedRequest, Env } from '../types'
import { del, put, respond, respondError } from '../utils'

export const set = async (
  request: AuthorizedRequest<{ key: string; value: unknown }>,
  env: Env
): Promise<Response> => {
  if (
    !request.parsedBody.data.key ||
    request.parsedBody.data.value === undefined
  ) {
    return respondError(400, 'Invalid request body')
  }

  // If value is null, delete the key.
  if (request.parsedBody.data.value === null) {
    await del(
      env,
      request.parsedBody.data.auth.publicKey,
      request.parsedBody.data.key
    )
  }
  // Otherwise, set it.
  else {
    await put(
      env,
      request.parsedBody.data.auth.publicKey,
      request.parsedBody.data.key,
      request.parsedBody.data.value
    )
  }

  return respond(200, {
    success: true,
  })
}
