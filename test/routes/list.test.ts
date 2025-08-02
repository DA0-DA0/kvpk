import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

import { list } from './routes'
import { kvSet } from '../../src/utils'

describe('GET /list/:uuid/:prefix', () => {
  it('returns 200 for valid prefix', async () => {
    // insert key-value pairs
    await kvSet(env, {
      uuid: 'user',
      key: 'hello1',
      value: 'world1',
    })
    await kvSet(env, {
      uuid: 'user',
      key: 'not-a-prefix',
      value: 'world3',
    })
    await kvSet(env, {
      uuid: 'user',
      key: 'hello2',
      value: 'world2',
    })

    const { response, body } = await list('user', 'hello')
    expect(response.status).toBe(200)
    expect(body).toEqual({
      items: [
        {
          key: 'hello1',
          value: 'world1',
        },
        {
          key: 'hello2',
          value: 'world2',
        },
      ],
    })
  })

  it('returns 200 with empty array if no keys match prefix', async () => {
    const { response, body } = await list('user', 'hello')
    expect(response.status).toBe(200)
    expect(body).toEqual({
      items: [],
    })
  })

  it('returns 200 with empty array if not a prefix', async () => {
    // insert key-value pair
    await kvSet(env, {
      uuid: 'user',
      key: 'hello',
      value: 'world',
    })

    const { response, body } = await list('user', 'hellooo')
    expect(response.status).toBe(200)
    expect(body).toEqual({
      items: [],
    })
  })

  it('returns 200 with empty array if no keys match prefix for a different UUID', async () => {
    // insert key-value pair
    await kvSet(env, {
      uuid: 'user',
      key: 'hello',
      value: 'world',
    })

    const { response, body } = await list('user2', 'hello')
    expect(response.status).toBe(200)
    expect(body).toEqual({
      items: [],
    })
  })

  it('returns 200 and limits the number of items', async () => {
    // insert key-value pairs
    await kvSet(env, {
      uuid: 'user',
      key: 'hello1',
      value: 'world1',
    })
    await kvSet(env, {
      uuid: 'user',
      key: 'hello2',
      value: 'world2',
    })
    await kvSet(env, {
      uuid: 'user',
      key: 'hello3',
      value: 'world3',
    })

    const { response, body } = await list('user', 'hello', 2)
    expect(response.status).toBe(200)
    expect(body).toEqual({
      items: [
        {
          key: 'hello1',
          value: 'world1',
        },
        {
          key: 'hello2',
          value: 'world2',
        },
      ],
    })
  })
})
