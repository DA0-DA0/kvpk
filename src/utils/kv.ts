import { Env } from '../types'
import { keyForPk, reverseKeyForPk } from './keys'

export const put = async (
  { DATA }: Env,
  publicKey: string,
  key: string,
  value: unknown
) =>
  await Promise.all([
    DATA.put(keyForPk(publicKey, key), JSON.stringify(value)),
    DATA.put(reverseKeyForPk(publicKey, key), JSON.stringify(value)),
  ])

export const del = async ({ DATA }: Env, publicKey: string, key: string) =>
  await Promise.all([
    DATA.delete(keyForPk(publicKey, key)),
    DATA.delete(reverseKeyForPk(publicKey, key)),
  ])
