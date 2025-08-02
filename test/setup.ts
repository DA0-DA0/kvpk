import { fetchMock } from 'cloudflare:test'
import { afterAll, beforeAll, vi } from 'vitest'

import { resetTestDb } from './db'

// Suppress console.error output.
vi.spyOn(console, 'error').mockImplementation(() => {})

beforeAll(async () => {
  await resetTestDb()

  fetchMock.activate()
  fetchMock.disableNetConnect()
})

afterAll(() => {
  fetchMock.assertNoPendingInterceptors()
})
