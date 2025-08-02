import { AuthorizedRequest, PfpkFetchAuthenticatedResponse } from './types'
import { json } from 'itty-router'

// Middleware to protect routes with the above function. If it does not return,
// the request is authorized. If successful, the `parsedBody` field will be set
// on the request object, accessible by successive middleware and route
// handlers.
export const authMiddleware = async (
  request: AuthorizedRequest
): Promise<Response | void> => {
  // If JWT token is provided, verify it.
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    throw json(
      { error: 'Unauthorized: No authorization header.' },
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const [type, token] = authHeader.split(' ')

  if (type !== 'Bearer') {
    throw json(
      { error: 'Unauthorized: Invalid token type, expected `Bearer`.' },
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  if (!token) {
    throw json(
      { error: 'Unauthorized: No token provided.' },
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // Validate token against PFPK auth.
  const authenticated = await fetch(
    'https://pfpk.daodao.zone/auth?' +
      new URLSearchParams({
        audience: 'kvpk.daodao.zone',
        role: 'admin',
      }),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  // Pass through errors from PFPK auth.
  if (!authenticated.ok) {
    const body = await authenticated.text().catch(() => 'Unknown error')
    let error = `Unknown error: status=${authenticated.status} statusText=${authenticated.statusText} body=${body}`
    try {
      error = JSON.parse(body).error
    } catch {}

    throw json(
      { error },
      {
        status: authenticated.status,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // On success, set UUID on request.
  const { uuid } = await authenticated
    .json<PfpkFetchAuthenticatedResponse>()
    .catch(() => ({
      uuid: '',
    }))
  if (!uuid) {
    throw json(
      { error: 'Expected UUID in response but got none.' },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  request.uuid = uuid
}
