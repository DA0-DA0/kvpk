import { env, fetchMock } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'

import { TEST_HOSTNAME, arrayRemove, get } from './routes'
import { kvSet } from '../../src/utils'

const mock = () =>
  fetchMock
    .get('https://pfpk.daodao.zone')
    .intercept({
      path: `/auth?audience=${TEST_HOSTNAME}&role=admin`,
    })
    .reply(200, {
      uuid: 'user',
    })

describe('POST /arrayRemove', () => {
  describe('when the token is valid', () => {
    beforeEach(() => {
      mock()
    })

    it('returns 200 and removes value', async () => {
      await kvSet(env, {
        uuid: 'user',
        key: 'hello',
        value: ['world'],
      })

      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: ['world'],
      })

      const { response, body } = await arrayRemove(
        {
          key: 'hello',
          index: 0,
        },
        'token'
      )
      expect(response.status).toBe(200)
      expect(body).toEqual({
        key: 'hello',
        value: [],
      })

      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: [],
      })

      await kvSet(env, {
        uuid: 'user',
        key: 'hello',
        value: ['world1', 'world2', 'world3'],
      })

      mock()
      const { response: response2, body: body2 } = await arrayRemove(
        {
          key: 'hello',
          index: 1,
        },
        'token'
      )
      expect(response2.status).toBe(200)
      expect(body2).toEqual({
        key: 'hello',
        value: ['world1', 'world3'],
      })

      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: ['world1', 'world3'],
      })
    })

    it('returns 400 if the index is out of bounds', async () => {
      await kvSet(env, {
        uuid: 'user',
        key: 'hello',
        value: ['world'],
      })

      const { response, error } = await arrayRemove(
        {
          key: 'hello',
          index: -1,
        },
        'token'
      )
      expect(response.status).toBe(400)
      expect(error).toBe('Index is out of bounds.')

      mock()
      const { response: response2, error: error2 } = await arrayRemove(
        {
          key: 'hello',
          index: 1,
        },
        'token'
      )
      expect(response2.status).toBe(400)
      expect(error2).toBe('Index is out of bounds.')

      await kvSet(env, {
        uuid: 'user',
        key: 'hello',
        value: ['world'],
      })

      mock()
      const { response: response3, error: error3 } = await arrayRemove(
        {
          key: 'hello',
          index: 2,
        },
        'token'
      )
      expect(response3.status).toBe(400)
      expect(error3).toBe('Index is out of bounds.')
    })

    it('returns 400 when the body is not a JSON object', async () => {
      const { response, error } = await arrayRemove(
        {
          key: 'hello',
          index: 0,
        },
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

    it('returns 400 if the key is empty', async () => {
      const { response, error } = await arrayRemove(
        {
          key: '',
          index: 0,
        },
        'token'
      )
      expect(response.status).toBe(400)
      expect(error).toBe('Empty key.')
    })

    it('returns 404 if the key does not exist', async () => {
      const { response, error } = await arrayRemove(
        {
          key: 'hello',
          index: 0,
        },
        'token'
      )
      expect(response.status).toBe(404)
      expect(error).toBe('Key does not exist.')

      // Ensure that the key-value pair was not changed.
      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: null,
      })
    })

    it('returns 400 if the key exists but is not an array', async () => {
      await kvSet(env, {
        uuid: 'user',
        key: 'hello',
        value: 'world',
      })

      const { response, error } = await arrayRemove(
        {
          key: 'hello',
          index: 0,
        },
        'token'
      )
      expect(response.status).toBe(400)
      expect(error).toBe('Key has a non-array value.')

      // Ensure that the key-value pair was not changed.
      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: 'world',
      })
    })
  })

  describe('when the token header is invalid', () => {
    it('returns 401 when no header is provided', async () => {
      const { response, error } = await arrayRemove({
        key: 'hello',
        index: 0,
      })
      expect(response.status).toBe(401)
      expect(error).toBe('Unauthorized: No authorization header.')

      // Ensure that the key-value pair was not set.
      expect((await get('user', 'hello')).body).toEqual({
        key: 'hello',
        value: null,
      })
    })

    it('returns 401 when the header is not a Bearer token', async () => {
      const { response, error } = await arrayRemove(
        {
          key: 'hello',
          index: 0,
        },
        '',
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
      const { response, error } = await arrayRemove(
        {
          key: 'hello',
          index: 0,
        },
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

      const { response: response1, error: error1 } = await arrayRemove(
        {
          key: 'hello',
          index: 0,
        },
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

      const { response: response2, error: error2 } = await arrayRemove(
        {
          key: 'hello',
          index: 0,
        },
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

      const { response, error } = await arrayRemove(
        {
          key: 'hello',
          index: 0,
        },
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

      const { response, error } = await arrayRemove(
        {
          key: 'hello',
          index: 0,
        },
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

      const { response, error } = await arrayRemove(
        {
          key: 'hello',
          index: 0,
        },
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

      const { response, error } = await arrayRemove(
        {
          key: 'hello',
          index: 0,
        },
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
