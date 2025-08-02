import { env, fetchMock } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'

import { TEST_HOSTNAME, get, setMany } from './routes'
import { kvSet } from '../../src/utils'

describe('POST /setMany', () => {
  describe('when the token is valid', () => {
    beforeEach(() => {
      fetchMock
        .get('https://pfpk.daodao.zone')
        .intercept({
          path: `/auth?audience=${TEST_HOSTNAME}&role=admin`,
        })
        .reply(200, {
          uuid: 'user',
        })
    })

    it('returns 204 and sets values', async () => {
      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: null,
      })
      expect((await get('user', 'foo')).body).toEqual({
        key: 'foo',
        value: null,
      })

      const { response } = await setMany(
        [
          {
            key: 'hello',
            value: 'world',
          },
          {
            key: 'foo',
            value: 'bar',
          },
        ],
        'token'
      )
      expect(response.status).toBe(204)

      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: 'world',
      })
      expect((await get('user', 'foo')).body).toEqual({
        key: 'foo',
        value: 'bar',
      })
    })

    it('returns 204 and deletes values', async () => {
      // Insert key-value pairs.
      await kvSet(env, {
        uuid: 'user',
        key: 'hello',
        value: 'world',
      })
      await kvSet(env, {
        uuid: 'user',
        key: 'foo',
        value: 'bar',
      })

      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: 'world',
      })
      expect((await get('user', 'foo')).body).toEqual({
        key: 'foo',
        value: 'bar',
      })

      const { response } = await setMany(
        [
          {
            key: 'hello',
            value: null,
          },
          {
            key: 'baz',
            value: 'qux',
          },
          {
            key: 'foo',
            value: null,
          },
        ],
        'token'
      )
      expect(response.status).toBe(204)

      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: null,
      })
      expect((await get('user', 'baz')).body).toEqual({
        key: 'baz',
        value: 'qux',
      })
      expect((await get('user', 'foo')).body).toEqual({
        key: 'foo',
        value: null,
      })
    })

    it('returns 400 when the body is not a JSON object', async () => {
      const { response, error } = await setMany(
        [
          {
            key: 'hello',
            value: 'world',
          },
        ],
        'token',
        undefined,
        // Override the body to be a string.
        'notJson'
      )
      expect(response.status).toBe(400)
      expect(error).toBe(
        'Failed to parse JSON body: Unexpected token \'o\', "notJson" is not valid JSON'
      )
    })

    it('returns 400 if a key is empty', async () => {
      const { response, error } = await setMany(
        [
          {
            key: '',
            value: 'world',
          },
        ],
        'token'
      )
      expect(response.status).toBe(400)
      expect(error).toBe('Invalid items.')
    })

    it('returns 400 if a value is empty', async () => {
      const { response, error } = await setMany(
        [
          {
            key: 'hello',
            value: undefined,
          },
        ],
        'token'
      )
      expect(response.status).toBe(400)
      expect(error).toBe('Invalid items.')
    })

    it('returns 400 if the key is too long', async () => {
      const { response, error } = await setMany(
        [
          {
            key: 'a'.repeat(257),
            value: 'world',
          },
        ],
        'token'
      )
      expect(response.status).toBe(400)
      expect(error).toBe('Key is too long. Max length is 256 characters.')
    })

    it('returns 400 if the value is too large', async () => {
      const { response, error } = await setMany(
        [
          {
            key: 'hello',
            value: 'a'.repeat(100_001),
          },
        ],
        'token'
      )
      expect(response.status).toBe(400)
      expect(error).toBe('Value is too large. Max size is 100KB.')
    })

    it('returns 400 if the items array is empty', async () => {
      const { response, error } = await setMany([], 'token')
      expect(response.status).toBe(400)
      expect(error).toBe('Invalid items.')
    })

    it('returns 400 if the items array is not an array', async () => {
      const { response, error } = await setMany(
        'definitelyNotItems' as any,
        'token'
      )
      expect(response.status).toBe(400)
      expect(error).toBe('Invalid items.')
    })

    it('returns 400 if the items array has an empty item', async () => {
      const { response, error } = await setMany(
        [
          {
            key: 'hello',
            value: 'world',
          },
          {} as any,
        ],
        'token'
      )
      expect(response.status).toBe(400)
      expect(error).toBe('Invalid items.')
    })
  })

  describe('when the token header is invalid', () => {
    it('returns 401 when no header is provided', async () => {
      const { response, error } = await setMany([
        {
          key: 'hello',
          value: 'world',
        },
      ])
      expect(response.status).toBe(401)
      expect(error).toBe('Unauthorized: No authorization header.')

      // Ensure that the key-value pair was not set.
      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: null,
      })
    })

    it('returns 401 when the header is not a Bearer token', async () => {
      const { response, error } = await setMany(
        [
          {
            key: 'hello',
            value: 'world',
          },
        ],
        'token',
        {
          Authorization: 'Basic token',
        }
      )
      expect(response.status).toBe(401)
      expect(error).toBe('Unauthorized: Invalid token type, expected `Bearer`.')

      // Ensure that the key-value pair was not set.
      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: null,
      })
    })

    it('returns 401 when the token is empty', async () => {
      const { response, error } = await setMany(
        [
          {
            key: 'hello',
            value: 'world',
          },
        ],
        ''
      )
      expect(response.status).toBe(401)
      expect(error).toBe('Unauthorized: No token provided.')

      // Ensure that the key-value pair was not set.
      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: null,
      })
    })
  })

  describe('when the token is invalid', () => {
    it('passes 401 and 404 errors through from PFPK auth', async () => {
      fetchMock
        .get('https://pfpk.daodao.zone')
        .intercept({
          path: `/auth?audience=${TEST_HOSTNAME}&role=admin`,
        })
        .reply(401, {
          error: 'MOCK_UNAUTHORIZED',
        })

      const { response: response1, error: error1 } = await setMany(
        [
          {
            key: 'hello',
            value: 'world',
          },
        ],
        'token'
      )
      expect(response1.status).toBe(401)
      expect(error1).toBe('MOCK_UNAUTHORIZED')

      // Ensure that the key-value pair was not set.
      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: null,
      })

      fetchMock
        .get('https://pfpk.daodao.zone')
        .intercept({
          path: `/auth?audience=${TEST_HOSTNAME}&role=admin`,
        })
        .reply(404, {
          error: 'MOCK_NOT_FOUND',
        })

      const { response: response2, error: error2 } = await setMany(
        [
          {
            key: 'hello',
            value: 'world',
          },
        ],
        'token'
      )
      expect(response2.status).toBe(404)
      expect(error2).toBe('MOCK_NOT_FOUND')

      // Ensure that the key-value pair was not set.
      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: null,
      })
    })

    it('returns 500 for other errors from PFPK auth', async () => {
      fetchMock
        .get('https://pfpk.daodao.zone')
        .intercept({
          path: `/auth?audience=${TEST_HOSTNAME}&role=admin`,
        })
        .reply(412, {
          error: 'MOCK_PRECONDITION_FAILED',
        })

      const { response, error } = await setMany(
        [
          {
            key: 'hello',
            value: 'world',
          },
        ],
        'token'
      )
      expect(response.status).toBe(500)
      expect(error).toBe(
        'Unexpected error from PFPK auth: status=412 statusText=Precondition Failed body={"error":"MOCK_PRECONDITION_FAILED"}'
      )

      // Ensure that the key-value pair was not set.
      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: null,
      })
    })

    it('returns 500 when auth does not return a UUID field', async () => {
      fetchMock
        .get('https://pfpk.daodao.zone')
        .intercept({
          path: `/auth?audience=${TEST_HOSTNAME}&role=admin`,
        })
        .reply(200, {
          notUuid: 'user',
        })

      const { response, error } = await setMany(
        [
          {
            key: 'hello',
            value: 'world',
          },
        ],
        'token'
      )
      expect(response.status).toBe(500)
      expect(error).toBe(
        'Error parsing PFPK auth response: UUID does not exist or is malformed.'
      )

      // Ensure that the key-value pair was not set.
      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: null,
      })
    })

    it('returns 500 when auth returns a non-string UUID', async () => {
      fetchMock
        .get('https://pfpk.daodao.zone')
        .intercept({
          path: `/auth?audience=${TEST_HOSTNAME}&role=admin`,
        })
        .reply(200, {
          uuid: 123,
        })

      const { response, error } = await setMany(
        [
          {
            key: 'hello',
            value: 'world',
          },
        ],
        'token'
      )
      expect(response.status).toBe(500)
      expect(error).toBe(
        'Error parsing PFPK auth response: UUID does not exist or is malformed.'
      )

      // Ensure that the key-value pair was not set.
      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: null,
      })
    })

    it('returns 500 when auth returns a non-JSON response', async () => {
      fetchMock
        .get('https://pfpk.daodao.zone')
        .intercept({
          path: `/auth?audience=${TEST_HOSTNAME}&role=admin`,
        })
        .reply(200, 'notJson')

      const { response, error } = await setMany(
        [
          {
            key: 'hello',
            value: 'world',
          },
        ],
        'token'
      )
      expect(response.status).toBe(500)
      expect(error).toBe(
        'Error parsing PFPK auth response: Unexpected token \'o\', "notJson" is not valid JSON'
      )

      // Ensure that the key-value pair was not set.
      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: null,
      })
    })
  })
})
