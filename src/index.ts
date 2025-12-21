import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { readFileSync } from 'node:fs'
import { parseAdminAuthHeader } from '@atproto/tap'
import Database from 'better-sqlite3'

const app = new Hono()
const dbPath = process.env.TAP_DATABASE_PATH || '/data/tap.db'
const db = new Database(dbPath, { readonly: true })

// Root page - serve ASCII art file
app.get('/', (c) => {
    const ascii = readFileSync('/app/ascii2.txt', 'utf-8')
    return c.text(ascii)
})

// Sidecar endpoint - list tracked repos (requires authentication)
app.get('/repos/:cursor?', (c) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
        return c.json({ error: 'Unauthorized' }, 401)
    }

    const password = parseAdminAuthHeader(authHeader)
    if (password !== process.env.TAP_ADMIN_PASSWORD) {
        return c.json({ error: 'Forbidden' }, 403)
    }

    const cursor = c.req.param('cursor')
    const limit = 100

    let rows:{ did:string }[]
    if (cursor) {
        rows = db.prepare('SELECT did FROM repos WHERE did > ? ' +
            'ORDER BY did LIMIT ?').all(cursor, limit) as { did:string }[]
    } else {
        rows = db.prepare('SELECT did FROM repos ' +
            'ORDER BY did LIMIT ?').all(limit) as { did:string }[]
    }

    const dids = rows.map(r => r.did)
    const nextCursor = rows.length === limit ? dids[dids.length - 1] : null

    return c.json({ dids, cursor: nextCursor })
})

// Proxy everything else to Tap
app.all('*', async (c) => {
    const url = new URL(c.req.url)
    url.host = 'localhost:2480'
    url.protocol = 'http:'

    const headers = new Headers(c.req.raw.headers)
    headers.delete('host')

    const response = await fetch(url.toString(), {
        method: c.req.method,
        headers,
        body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ?
            c.req.raw.body :
            undefined,
        duplex: 'half',
    } as RequestInit)

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    })
})

serve({ fetch: app.fetch, port: 8080 })
console.log('Gateway listening on :8080')
