export const keyForPk = (publicKey: string, key: string) =>
  `KV:${publicKey}:${key}`

export const reverseKeyForPk = (publicKey: string, key: string) =>
  `REVERSE_KV:${key}:${publicKey}`
