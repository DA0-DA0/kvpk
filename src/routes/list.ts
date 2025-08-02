import { json, RequestHandler } from 'itty-router'
import { keyForUuid } from '../utils'
import { ListResponse } from '../types'

export const list: RequestHandler = async (
  request,
  { DATA }: Env
): Promise<ListResponse> => {
  const { uuid, prefix } = request.params || {}

  if (!uuid) {
    throw json({ error: 'Missing UUID.' }, { status: 400 })
  }
  if (!prefix) {
    throw json({ error: 'Missing prefix.' }, { status: 400 })
  }

  const keys: string[] = []
  let cursor: string | undefined
  while (true) {
    const response = await DATA.list({
      prefix: keyForUuid(uuid, prefix),
      cursor,
    })

    keys.push(
      ...response.keys.map((k) =>
        // Remove the UUID prefix from the key.
        k.name.replace(keyForUuid(uuid, ''), '')
      )
    )

    if (response.list_complete) {
      break
    }

    cursor = response.cursor
  }

  const values = await Promise.all(
    keys.map((key) =>
      DATA.get(keyForUuid(uuid, key)).then((stringifiedValue) =>
        stringifiedValue ? JSON.parse(stringifiedValue) : null
      )
    )
  )

  return {
    items: keys
      .map((key, i) => ({
        key,
        value: values[i],
      }))
      // Filter out null values since these keys were deleted.
      .filter(({ value }) => value !== null),
  }
}
