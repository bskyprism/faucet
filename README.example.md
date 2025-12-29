# Tap + fly.io

This a [Tap server](https://docs.bsky.app/blog/introducing-tap) &mdash; the
sync server made by Bluesky &mdash; plus a Node JS server that adds a query
to return all followed repos.

> Tap is the all-in-one tool for synchronizing subsets of the Atmosphere

Tap requires a password for all operations, read or write.
The caller (e.g. a browser) must submit the password with the request.

<details><summary><h2>Contents</h2></summary>
<!-- toc -->
</details>

## Node

This adds a Node JS server in addition to Tap. The Node server provides
an endpoint to list all repos that Tap is following, and also serves
some ascii art at the root path.


## Architecture

This machine hosts both a tap server and a Node JS process.


```
┌─────────────────────────────────────────┐
│          Fly.io (example.app)           │
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
