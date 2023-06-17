# kvpk

key-value for private key

A [Cloudflare Worker](https://workers.cloudflare.com/) that allows a Cosmos
keypair to store arbitrary data in a KV store. Like the blockchain, **all data
is publicly readable.** This is _not_ a secure storage solution.

Used template for [Cosmos wallet
authentication](https://github.com/NoahSaso/cloudflare-worker-cosmos-auth) to
authenticate requests via a [Cosmos](https://cosmos.network) wallet signature.

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

See [the authentication template's
docs](https://github.com/NoahSaso/cloudflare-worker-cosmos-auth#client-usage) on
how to authenticate requests with a Cosmos wallet.

### `POST /set`

The request data for this route must be included in the `data` field that gets
signed in the authentication API described above.

Set a key-value pair in the KV store. Set `value` to `null` to delete a key. Any
other value will be stored and returned identically.

#### Request data:

```typescript
{
  "key": string
  "value": any | null
}
```

#### Response:

```typescript
{
  "success": true
}
```

### `POST /setMany`

The request data for this route must be included in the `data` field that gets
signed in the authentication API described above.

Set many key-value pairs in the KV store. Set `value` to `null` to delete a key.
Any other value will be stored and returned identically.

#### Request data:

```typescript
{
  "data": {
    "key": string
    "value": any | null
  }[]
}
```

#### Response:

```typescript
{
  "success": true
}
```

### `GET /get/:publicKey/:key`

Get a value from the KV store. `publicKey` is a hex-encoded Cosmos public key.

#### Response:

```typescript
{
  "key": string
  "value": any | null
}
```

### `GET /list/:publicKey/:prefix`

List keys with a prefix in the KV store. `publicKey` is a hex-encoded Cosmos
public key.

#### Response:

```typescript
{
  "items": Array<{
    "key": string
    "value": any
  }>
}
```
