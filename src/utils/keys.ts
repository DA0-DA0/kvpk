/**
 * The key is used to lookup a value for a given UUID and key.
 */
export const keyForUuid = (uuid: string, key: string) => `KV:${uuid}:${key}`

/**
 * The reverse key is used to lookup all keys for a given UUID.
 */
export const reverseKeyForUuid = (uuid: string, key: string) =>
  `REVERSE_KV:${key}:${uuid}`
