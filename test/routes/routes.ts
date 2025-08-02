import { SELF } from 'cloudflare:test'

import {
  ArrayInsertRequest,
  ArrayRemoveRequest,
  GetResponse,
  ListResponse,
  ReverseResponse,
  SetManyRequest,
  SetRequest,
} from '../../src/types'

export const TEST_HOSTNAME = 'kvpk.test'

const url = (
  path: string,
  query?: [string, string][] | Record<string, string>
) =>
  'https://' +
  TEST_HOSTNAME +
  path +
  (query ? `?${new URLSearchParams(query).toString()}` : '')

export const get = async (uuid: string, key: string) => {
  const request = new Request(url(`/get/${uuid}/${key}`), { method: 'GET' })
  const response = await SELF.fetch(request)
  const body = await response.json<any>()
  return {
    response,
    body: body as GetResponse,
    error: body?.error as string | undefined,
  }
}

export const list = async (uuid: string, prefix: string, limit?: number) => {
  const request = new Request(
    url(
      `/list/${uuid}/${prefix}`,
      limit ? { limit: limit.toString() } : undefined
    ),
    { method: 'GET' }
  )
  const response = await SELF.fetch(request)
  const body = await response.json<any>()
  return {
    response,
    body: body as ListResponse,
    error: body?.error as string | undefined,
  }
}

export const reverse = async (key: string, limit?: number) => {
  const request = new Request(
    url(`/reverse/${key}`, limit ? { limit: limit.toString() } : undefined),
    { method: 'GET' }
  )
  const response = await SELF.fetch(request)
  const body = await response.json<any>()
  return {
    response,
    body: body as ReverseResponse,
    error: body?.error as string | undefined,
  }
}

export const set = async (
  data?: SetRequest,
  token?: string,
  headers?: Record<string, string>,
  bodyOverride?: string
) => {
  const request = new Request(url('/set'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token !== undefined ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: bodyOverride ?? (data && JSON.stringify(data)),
  })
  const response = await SELF.fetch(request)
  const body = response.body ? await response.json<any>() : undefined
  return {
    response,
    error: body?.error as string | undefined,
  }
}

export const setMany = async (
  data?: SetManyRequest['items'],
  token?: string,
  headers?: Record<string, string>,
  bodyOverride?: string
) => {
  const request = new Request(url('/setMany'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token !== undefined ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: bodyOverride ?? (data && JSON.stringify({ items: data })),
  })
  const response = await SELF.fetch(request)
  const body = response.body ? await response.json<any>() : undefined
  return {
    response,
    error: body?.error as string | undefined,
  }
}

export const arrayInsert = async (
  data?: ArrayInsertRequest,
  token?: string,
  headers?: Record<string, string>,
  bodyOverride?: string
) => {
  const request = new Request(url('/arrayInsert'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token !== undefined ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: bodyOverride ?? (data && JSON.stringify(data)),
  })
  const response = await SELF.fetch(request)
  const body = response.body ? await response.json<any>() : undefined
  return {
    response,
    body: body as GetResponse,
    error: body?.error as string | undefined,
  }
}

export const arrayRemove = async (
  data?: ArrayRemoveRequest,
  token?: string,
  headers?: Record<string, string>,
  bodyOverride?: string
) => {
  const request = new Request(url('/arrayRemove'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token !== undefined ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: bodyOverride ?? (data && JSON.stringify(data)),
  })
  const response = await SELF.fetch(request)
  const body = response.body ? await response.json<any>() : undefined
  return {
    response,
    body: body as GetResponse,
    error: body?.error as string | undefined,
  }
}
