# faucet

A template for a [Tap server](https://docs.bsky.app/blog/introducing-tap)
on [fly.io](https://fly.io/).

This adds an endpoint, `GET /repos/:cursor?` that will return a list of all
repos that the tap server is tracking.

## How To

1. Use the template button in the Github UI
2. `mv README.example.md README.md`
3. `touch .env` and add a `TAP_ADMIN_PASSWORD`
4. Edit the values in `fly.toml`
5. `fly launch`

The `TAP_ADMIN_PASSWORD` should be
[sent with any requests](https://github.com/bluesky-social/indigo/tree/main/cmd/tap#authentication).
The `@atproto/tap` package exposes a function to parse the header:

```ts
import { parseAdminAuthHeader } from '@atproto/tap'
const authHeader = myRequest.header('Authorization')
const password = parseAdminAuthHeader(authHeader)
if (password !== myAdminPassword) {
    return c.json({ error: 'Forbidden' }, 403)
}
```

## Generate a Random Secret

```sh
openssl rand -base64 32
```
