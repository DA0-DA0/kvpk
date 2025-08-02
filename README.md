# kvpk

key-value for private key

A [Cloudflare Worker](https://workers.cloudflare.com/) that allows a private
key, typically associated with a blockchain wallet, to store arbitrary data in a
KV store. Like most blockchains, **all data is publicly available.** This is
_not_ a secure storage solution—only write access is authenticated.

It uses the [PFPK](https://github.com/DA0-DA0/pfpk) auth service as its
authentication layer, which lets users manage unique profiles with one or more
public key authorized to access them. PFPK generates a UUID (universally unique
identifier) for each profile, which KVPK associates key-value pairs with.

To look up a value for a given public key or blockchain address, use
[PFPK's profile retrieval endpoint](https://github.com/DA0-DA0/pfpk?tab=readme-ov-file#get-publickey)
to resolve the profile's UUID, and then look it up here.

## Development

### Run locally

```sh
npm run dev
# OR
wrangler dev --local --persist
```

### Configuration

1. Copy `wrangler.toml.example` to `wrangler.toml`.

2. Create KV namespaces for production and development:

```sh
npx wrangler kv:namespace create NONCES
npx wrangler kv:namespace create NONCES --preview

npx wrangler kv:namespace create DATA
npx wrangler kv:namespace create DATA --preview
```

3. Update the binding IDs in `wrangler.toml`:

```toml
kv-namespaces = [
  { binding = "NONCES", id = "<INSERT NONCES_ID>", preview_id = "<INSERT NONCES_PREVIEW_ID>" },
  { binding = "DATA", id = "<INSERT DATA_ID>", preview_id = "<INSERT DATA_PREVIEW_ID>" },
]
```

## Deploy

```sh
wrangler publish
# OR
npm run deploy
```

## API

Request and response bodies are encoded via JSON.

### Authentication

1. Create a token with the PFPK auth service.

   The token must have this service's hostname (probably `kvpk.daodao.zone`) as
   the audience, and `admin` as the role.

   See the [PFPK auth service
   docs](https://github.com/DA0-DA0/pfpk?tab=readme-ov-file#post-tokens) for more
   information.

2. Set a bearer token in the `Authorization` header, like: `Authorization: Bearer JWT_TOKEN`.

### `POST /set`

Set the `Authorization` header to the PFPK auth token as described above.

Set a key-value pair in the KV store. Set `value` to `null` to delete a key. Any
other value will be stored and returned identically.

#### Request

```typescript
{
  "key": string
  "value": any | null
}
```

#### Response

A 204 No Content response is returned on success.

### `POST /setMany`

Set the `Authorization` header to the PFPK auth token as described above.

Set many key-value pairs in the KV store. Set `value` to `null` to delete a key.
Any other value will be stored and returned identically.

#### Request

```typescript
{
  "items": {
    "key": string
    "value": any | null
  }[]
}
```

#### Response

A 204 No Content response is returned on success.

### `GET /get/:uuid/:key`

No authentication is required.

Get a value from the KV store. `uuid` is the UUID of the user's profile from the
PFPK auth service.

#### Response

```typescript
{
  "key": string
  "value": any | null
}
```

### `GET /list/:uuid/:prefix`

No authentication is required.

List keys with a prefix in the KV store. `uuid` is the UUID of the user's
profile from the PFPK auth service.

#### Response

```typescript
{
  "items": Array<{
    "key": string
    "value": any
  }>
}
```

### `GET /reverse/:key`

No authentication is required.

Get the list of UUIDs that have a key-value pair with the given key in the KV
store.

#### Response

```typescript
{
  "items": Array<{
    "uuid": string
    "value": any
  }>
}
```
