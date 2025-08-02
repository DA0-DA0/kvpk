import { json } from 'itty-router'

import { AuthorizedRequest, PfpkFetchAuthenticatedResponse } from './types'

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
      }
    )
  }

  const [type, token] = authHeader.split(' ')

  if (type !== 'Bearer') {
    throw json(
      { error: 'Unauthorized: Invalid token type, expected `Bearer`.' },
      {
        status: 401,
      }
    )
  }

  if (!token) {
    throw json(
      { error: 'Unauthorized: No token provided.' },
      {
        status: 401,
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

    // Pass 401 and 404 errors through.
    if (authenticated.status === 401 || authenticated.status === 404) {
      throw json(
        { error },
        {
          status: authenticated.status,
        }
      )
    } else {
      throw json(
        {
          error: `Unexpected error from PFPK auth: status=${authenticated.status} statusText=${authenticated.statusText} body=${body}`,
        },
        {
          status: 500,
        }
      )
    }
  }

  // On success, set UUID on request.
  const { uuid } = await authenticated
    .json<PfpkFetchAuthenticatedResponse>()
    .catch(() => ({
      uuid: '',
    }))
  if (!uuid || typeof uuid !== 'string') {
    throw json(
      { error: 'Expected UUID in PFPK auth response but got none.' },
      {
        status: 500,
      }
    )
  }

  request.uuid = uuid

  // Parse JSON body and set on request.
  try {
    request.data = await request.json()
  } catch (err) {
    throw json(
      {
        error: `Failed to parse JSON body: ${err instanceof Error ? err.message : `${err}`}`,
      },
      {
        status: 400,
      }
    )
  }
}
