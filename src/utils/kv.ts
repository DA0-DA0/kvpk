import { json } from 'itty-router'
import { keyForUuid, reverseKeyForUuid } from './keys'

export const put = (
  { DATA }: Env,
  uuid: string,
  key: string,
  value: unknown
) => {
  const stringifiedValue = JSON.stringify(value)

  // Set min key length to 1 character.
  if (key.length < 1) {
    throw json(
      { error: 'Key is too short. Min length is 1 character.' },
      { status: 400 }
    )
  }
  // Set max key length to 256 characters.
  if (key.length > 256) {
    throw json(
      { error: 'Key is too long. Max length is 256 characters.' },
      { status: 400 }
    )
  }
  // Set max value size to 100KB.
  if (stringifiedValue.length > 100_000) {
    throw json(
      { error: 'Value is too large. Max size is 100KB.' },
      { status: 400 }
    )
  }

  return Promise.all([
    DATA.put(keyForUuid(uuid, key), JSON.stringify(value)),
    DATA.put(reverseKeyForUuid(uuid, key), JSON.stringify(value)),
  ])
}

export const del = ({ DATA }: Env, uuid: string, key: string) =>
  Promise.all([
    DATA.delete(keyForUuid(uuid, key)),
    DATA.delete(reverseKeyForUuid(uuid, key)),
  ])
