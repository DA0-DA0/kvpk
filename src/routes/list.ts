import { Request as IttyRequest } from 'itty-router'
import { Env } from '../types'
import { keyForPk, respond, respondError } from '../utils'

export const list = async (
  request: IttyRequest,
  { DATA }: Env
): Promise<Response> => {
  const publicKey = request.params?.publicKey
  if (!publicKey) {
    return respondError(400, 'Missing publicKey.')
  }

  const prefix = request.params?.prefix
  if (!prefix) {
    return respondError(400, 'Missing prefix.')
  }

  const keys: string[] = []
  let cursor: string | undefined
  while (true) {
    const response = await DATA.list({
      prefix: keyForPk(publicKey, prefix),
      cursor,
    })

    keys.push(
      ...response.keys.map((k) =>
        // Remove the public key prefix from the key.
        k.name.replace(keyForPk(publicKey, ''), '')
      )
    )

    if (response.list_complete) {
      break
    }

    cursor = response.cursor
  }

  const values = await Promise.all(
    keys.map((key) =>
      DATA.get(keyForPk(publicKey, key)).then((stringifiedValue) =>
        stringifiedValue ? JSON.parse(stringifiedValue) : null
      )
    )
  )

  return respond(200, {
    items: keys
      .map((key, i) => ({
        key,
        value: values[i],
      }))
      // Filter out null values since these keys were deleted.
      .filter(({ value }) => value !== null),
  })
}
