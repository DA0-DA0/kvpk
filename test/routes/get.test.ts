import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

import { get } from './routes'
import { kvSet } from '../../src/utils'

describe('GET /get/:uuid/:key', () => {
  it('returns 200 for valid key', async () => {
    // insert key-value pair
    await kvSet(env, {
      uuid: 'user',
      key: 'hello',
      value: 'world',
    })

    const { response, body } = await get('user', 'hello')
    expect(response.status).toBe(200)
    expect(body).toEqual({
      key: 'hello',
      value: 'world',
    })
  })

  it('returns 200 with null value if key is not set', async () => {
    const { response, body } = await get('user', 'hello')
    expect(response.status).toBe(200)
    expect(body).toEqual({
      key: 'hello',
      value: null,
    })
  })

  it('returns 200 with null value if key is a different UUID', async () => {
    // insert key-value pair
    await kvSet(env, {
      uuid: 'user',
      key: 'hello',
      value: 'world',
    })

    const { response, body } = await get('user2', 'hello')
    expect(response.status).toBe(200)
    expect(body).toEqual({
      key: 'hello',
      value: null,
    })
  })
})
