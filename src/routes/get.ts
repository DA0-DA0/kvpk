import { AuthorizedRequest, Env } from '../types'
import { keyForPk, respond, respondError } from '../utils'

export const get = async (
  request: AuthorizedRequest<{ key: string }>,
  { DATA }: Env
): Promise<Response> => {
  if (!request.parsedBody.data.key) {
    return respondError(400, 'Invalid request body')
  }

  const stringifiedValue = await DATA.get(
    keyForPk(
      request.parsedBody.data.auth.publicKey,
      request.parsedBody.data.key
    )
  )
  const value = stringifiedValue ? JSON.parse(stringifiedValue) : null

  return respond(200, {
    key: request.parsedBody.data.key,
    value,
  })
}
