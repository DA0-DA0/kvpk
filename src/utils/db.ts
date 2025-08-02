import { json } from 'itty-router'

/**
 * Update or insert a value in the database.
 */
export const kvSet = (
  { DB }: Env,
  { uuid, key, value }: { uuid: string; key: string; value: unknown }
) => {
  const stringifiedValue = JSON.stringify(value)

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

  return DB.prepare(
    `
      INSERT INTO items (profileUuid, key, value)
      VALUES (?1, ?2, ?3)
      ON CONFLICT (profileUuid, key)
      DO UPDATE SET value = ?3, updatedAt = CURRENT_TIMESTAMP
    `
  )
    .bind(uuid, key, stringifiedValue)
    .run()
}

/**
 * Delete a value from the database.
 */
export const kvUnset = (
  { DB }: Env,
  { uuid, key }: { uuid: string; key: string }
) =>
  DB.prepare(
    `
      DELETE FROM items
      WHERE profileUuid = ?1 AND key = ?2
    `
  )
    .bind(uuid, key)
    .run()

/**
 * Get a value from the database and parse it. Returns null if key is not set.
 */
export const kvGet = (
  { DB }: Env,
  { uuid, key }: { uuid: string; key: string }
) =>
  DB.prepare(
    `
      SELECT value FROM items
      WHERE profileUuid = ?1 AND key = ?2
    `
  )
    .bind(uuid, key)
    .first<{ value: string }>()
    .then((row) => (row ? row.value && JSON.parse(row.value) : null))

/**
 * List keys with prefix set for a given UUID.
 *
 * @param limit - Optional limit for the number of keys to return.
 */
export const kvList = (
  { DB }: Env,
  { uuid, prefix, limit }: { uuid: string; prefix: string; limit?: number }
) =>
  DB.prepare(
    `
      SELECT key, value FROM items
      WHERE profileUuid = ?1 AND key LIKE ?2
      ${limit ? `LIMIT ?3` : ''}
    `
  )
    .bind(uuid, `${prefix}%`, ...(limit ? [limit] : []))
    .all<{ key: string; value: string }>()
    .then(({ results }) =>
      results.map((row) => ({
        key: row.key,
        value: row.value && JSON.parse(row.value),
      }))
    )

/**
 * List UUIDs that have a key set.
 */
export const kvReverse = (
  { DB }: Env,
  { key, limit }: { key: string; limit?: number }
) =>
  DB.prepare(
    `
      SELECT profileUuid, value FROM items
      WHERE key = ?1
      ${limit ? `LIMIT ?2` : ''}
    `
  )
    .bind(key, ...(limit ? [limit] : []))
    .all<{ profileUuid: string; value: string }>()
    .then(({ results }) =>
      results.map((row) => ({
        uuid: row.profileUuid,
        value: row.value && JSON.parse(row.value),
      }))
    )
