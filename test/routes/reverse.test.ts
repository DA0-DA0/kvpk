import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

import { reverse } from './routes'
import { kvSet } from '../../src/utils'

describe('GET /reverse/:key', () => {
  it('returns 200 for valid key', async () => {
    // insert key-value pairs
    await kvSet(env, {
      uuid: 'user1',
      key: 'hello',
      value: 'world1',
    })
    await kvSet(env, {
      uuid: 'user1',
      key: 'not-a-key',
      value: 'world3',
    })
    await kvSet(env, {
      uuid: 'user2',
      key: 'hello',
      value: 'world2',
    })

    const { response, body } = await reverse('hello')
    expect(response.status).toBe(200)
    expect(body).toEqual({
      items: [
        {
          uuid: 'user1',
          value: 'world1',
        },
        {
          uuid: 'user2',
          value: 'world2',
        },
      ],
    })
  })

  it('returns 200 with empty array if no one has the key', async () => {
    // insert key-value pair
    await kvSet(env, {
      uuid: 'user',
      key: 'hello_NOT',
      value: 'world',
    })

    const { response, body } = await reverse('hello')
    expect(response.status).toBe(200)
    expect(body).toEqual({
      items: [],
    })
  })

  it('returns 200 and limits the number of items', async () => {
    // insert key-value pairs from different users
    await kvSet(env, {
      uuid: 'user1',
      key: 'hello',
      value: 'world1',
    })
    await kvSet(env, {
      uuid: 'user2',
      key: 'hello',
      value: 'world2',
    })
    await kvSet(env, {
      uuid: 'user3',
      key: 'hello',
      value: 'world3',
    })

    const { response, body } = await reverse('hello', 2)
    expect(response.status).toBe(200)
    expect(body).toEqual({
      items: [
        { uuid: 'user1', value: 'world1' },
        { uuid: 'user2', value: 'world2' },
      ],
    })
  })
})
