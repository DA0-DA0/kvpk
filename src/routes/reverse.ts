import { json, RequestHandler } from 'itty-router'
import { reverseKeyForUuid } from '../utils'
import { ReverseResponse } from '../types'

export const reverse: RequestHandler = async (
  request,
  { DATA }: Env
): Promise<ReverseResponse> => {
  const { key } = request.params || {}
  if (!key) {
    throw json({ error: 'Missing key.' }, { status: 400 })
  }

  const uuids: string[] = []
  let cursor: string | undefined
  while (true) {
    const response = await DATA.list({
      prefix: reverseKeyForUuid('', key),
      cursor,
    })

    uuids.push(
      ...response.keys.map((k) =>
        // Remove the key from the key.
        k.name.replace(reverseKeyForUuid('', key), '')
      )
    )

    if (response.list_complete) {
      break
    }

    cursor = response.cursor
  }

  const values = await Promise.all(
    uuids.map((uuid) =>
      DATA.get(reverseKeyForUuid(uuid, key)).then((stringifiedValue) =>
        stringifiedValue ? JSON.parse(stringifiedValue) : null
      )
    )
  )

  return {
    items: uuids
      .map((uuid, i) => ({
        uuid,
        value: values[i],
      }))
      // Filter out null values since these keys were deleted.
      .filter(({ value }) => value !== null),
  }
}
