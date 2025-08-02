import { IRequestStrict } from 'itty-router'

export type PfpkFetchAuthenticatedResponse = {
  uuid: string
}

export type AuthorizedRequest<
  Data extends Record<string, unknown> = Record<string, unknown>,
> = IRequestStrict & {
  /**
   * The parsed body of the request, if any.
   */
  data: Data
  /**
   * The UUID of the authenticated user.
   */
  uuid: string
}

export type SetRequest = {
  key: string
  value: unknown
}

export type SetManyRequest = {
  items: { key: string; value: unknown }[]
}

export type ArrayInsertRequest = {
  key: string
  value: unknown
  index?: number
}

export type ArrayRemoveRequest = {
  key: string
  index: number
}

export type GetResponse = {
  key: string
  value: unknown
}

export type ListResponse = {
  items: {
    key: string
    value: unknown
  }[]
}

export type ReverseResponse = {
  items: {
    uuid: string
    value: unknown
  }[]
}
