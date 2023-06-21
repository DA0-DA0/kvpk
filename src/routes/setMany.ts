import { AuthorizedRequest, Env } from '../types'
import { del, put, respond, respondError } from '../utils'

export const setMany = async (
  request: AuthorizedRequest<{ data: { key: string; value: unknown }[] }>,
  env: Env
): Promise<Response> => {
  if (
    !request.parsedBody.data.data ||
    !Array.isArray(request.parsedBody.data.data) ||
    request.parsedBody.data.data.length === 0 ||
    request.parsedBody.data.data.some(
      (item) => !item || !item.key || item.value === undefined
    )
  ) {
    return respondError(400, 'Invalid request body')
  }

  await Promise.all(
    request.parsedBody.data.data.map(async ({ key, value }) => {
      // If value is null, delete the key.
      if (value === null) {
        await del(env, request.parsedBody.data.auth.publicKey, key)
      }
      // Otherwise, set it.
      else {
        await put(env, request.parsedBody.data.auth.publicKey, key, value)
      }
    })
  )

  return respond(200, {
    success: true,
  })
}
