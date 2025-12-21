# Tap + fly.io

This the [Tap server](https://docs.bsky.app/blog/introducing-tap).
Tap is a sync server made by Bluesky.

> Tap is the all-in-one tool for synchronizing subsets of the Atmosphere

Tap requires a password for all operations, read or write.
The caller (e.g. a browser) must submit the password with the request.

## Architecture

This fly machine hosts both a tap server and a Node JS process. The Node
process gives us an endpoint to query the DB for a list of all followed repos.

```
┌─────────────────────────────────────────┐
│          Fly.io (drerings)              │
│  ┌────────────────────────────────────┐ │
│  │         Single Container           │ │
│  │  ┌────────────┐  ┌──────────────┐  │ │
│  │  │    Tap     │  │   Sidecar    │  │ │
│  │  │  :2480     │  │   :8081      │  │ │
│  │  └─────┬──────┘  └──────┬───────┘  │ │
│  │        │                │          │ │
│  │        └───────┬────────┘          │ │
│  │                │                   │ │
│  │         ┌──────▼──────┐            │ │
│  │         │ /data/tap.db│            │ │
│  │         └─────────────┘            │ │
│  │                                    │ │
│  │    supervisord (process manager)   │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

Otherwise, the HTTP API is
[described here](https://github.com/bluesky-social/indigo/tree/main/cmd/tap#http-api).

## ASCII Art

This serves an ascii art file at the root path. This is setup here in
the `Dockerfile`:

```dockerfile
# Setup sidecar
WORKDIR /app
COPY sidecar/package*.json ./
RUN npm install
COPY sidecar/ ./
COPY ascii2.txt ./
```

## DNS

This site is hosted by [fly.io](https://fly.io/) at
[drerings.fly.dev](https://drerings.fly.dev/).

It is also exposed at [tap.drerings.app](https://tap.drerings.app/).
