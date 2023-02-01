import { AuthorizedRequest, Env } from '../types'
import { keyForPk, respond, respondError } from '../utils'

export const list = async (
  request: AuthorizedRequest<{ prefix: string }>,
  { DATA }: Env
): Promise<Response> => {
  if (!request.parsedBody.data.prefix) {
    return respondError(400, 'Invalid request body')
  }

  const keys: string[] = []
  let cursor: string | undefined
  while (true) {
    const response = await DATA.list({
      prefix: keyForPk(
        request.parsedBody.data.auth.publicKey,
        request.parsedBody.data.prefix
      ),
      cursor,
    })

    keys.push(
      ...response.keys.map((k) =>
        // Remove the public key prefix from the key.
        k.name.replace(keyForPk(request.parsedBody.data.auth.publicKey, ''), '')
      )
    )

    if (response.list_complete) {
      break
    }

    cursor = response.cursor
  }

  const values = await Promise.all(
    keys.map((key) =>
      DATA.get(keyForPk(request.parsedBody.data.auth.publicKey, key)).then(
        (stringifiedValue) =>
          stringifiedValue ? JSON.parse(stringifiedValue) : null
      )
    )
  )

  return respond(200, {
    items: keys.map((key, i) => ({
      key,
      value: values[i],
    })),
  })
}
