import { Request as IttyRequest } from 'itty-router'
import { Env } from '../types'
import { respond, respondError, reverseKeyForPk } from '../utils'

export const reverse = async (
  request: IttyRequest,
  { DATA }: Env
): Promise<Response> => {
  const key = request.params?.key
  if (!key) {
    return respondError(400, 'Missing key.')
  }

  const publicKeys: string[] = []
  let cursor: string | undefined
  while (true) {
    const response = await DATA.list({
      prefix: reverseKeyForPk('', key),
      cursor,
    })

    publicKeys.push(
      ...response.keys.map((k) =>
        // Remove the key from the key.
        k.name.replace(reverseKeyForPk('', key), '')
      )
    )

    if (response.list_complete) {
      break
    }

    cursor = response.cursor
  }

  const values = await Promise.all(
    publicKeys.map((publicKey) =>
      DATA.get(reverseKeyForPk(publicKey, key)).then((stringifiedValue) =>
        stringifiedValue ? JSON.parse(stringifiedValue) : null
      )
    )
  )

  return respond(200, {
    items: publicKeys
      .map((publicKey, i) => ({
        publicKey,
        value: values[i],
      }))
      // Filter out null values since these keys were deleted.
      .filter(({ value }) => value !== null),
  })
}
