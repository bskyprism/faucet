import { test } from '@substrate-system/tapzero'
import Database from 'better-sqlite3'
import { createApp } from '../src/index'

function setupTestDb() {
    const db = new Database(':memory:')
    db.exec('CREATE TABLE repos (did TEXT PRIMARY KEY)')
    return db
}

test('/repos returns 401 without authorization header', async (t) => {
    const db = setupTestDb()
    const app = createApp({ db, adminPassword: 'secret123' })

    const res = await app.request('/repos')

    t.equal(res.status, 401, 'should return 401')
    const body = await res.json()
    t.equal(body.error, 'Unauthorized', 'should have error message')

    db.close()
})

test('/repos returns 403 with wrong password', async (t) => {
    const db = setupTestDb()
    const app = createApp({ db, adminPassword: 'secret123' })

    const res = await app.request('/repos', {
        headers: {
            'Authorization': 'Basic ' + Buffer
                .from('admin:wrongpassword')
                .toString('base64')
        }
    })

    t.equal(res.status, 403, 'should return 403')
    const body = await res.json()
    t.equal(body.error, 'Forbidden', 'should have error message')

    db.close()
})

test('/repos returns dids with correct password', async (t) => {
    const db = setupTestDb()
    const app = createApp({ db, adminPassword: 'secret123' })

    // Insert test data
    const insert = db.prepare('INSERT INTO repos (did) VALUES (?)')
    insert.run('did:plc:aaa')
    insert.run('did:plc:bbb')
    insert.run('did:plc:ccc')

    const res = await app.request('/repos', {
        headers: {
            'Authorization': 'Basic ' + Buffer
                .from('admin:secret123')
                .toString('base64')
        }
    })

    t.equal(res.status, 200, 'should return 200')
    const body = await res.json()
    t.equal(body.dids.length, 3, 'should return 3 dids')
    t.ok(body.dids.includes('did:plc:aaa'), 'should include first did')
    t.ok(body.dids.includes('did:plc:bbb'), 'should include second did')
    t.ok(body.dids.includes('did:plc:ccc'), 'should include third did')
    t.equal(body.cursor, null, 'cursor should be null when less than limit')

    db.close()
})

test('/repos pagination returns cursor when at limit', async (t) => {
    const db = setupTestDb()
    // Create app with limit of 100, insert exactly 100 items
    const app = createApp({ db, adminPassword: 'secret123' })

    const insert = db.prepare('INSERT INTO repos (did) VALUES (?)')
    for (let i = 0; i < 100; i++) {
        insert.run(`did:plc:${String(i).padStart(3, '0')}`)
    }

    const res = await app.request('/repos', {
        headers: {
            'Authorization': 'Basic ' + Buffer
                .from('admin:secret123')
                .toString('base64')
        }
    })

    t.equal(res.status, 200, 'should return 200')
    const body = await res.json()
    t.equal(body.dids.length, 100, 'should return 100 dids')
    t.equal(body.cursor, 'did:plc:099', 'cursor should be last did')

    db.close()
})

test('/repos pagination with cursor returns next page', async (t) => {
    const db = setupTestDb()
    const app = createApp({ db, adminPassword: 'secret123' })

    const insert = db.prepare('INSERT INTO repos (did) VALUES (?)')
    insert.run('did:plc:aaa')
    insert.run('did:plc:bbb')
    insert.run('did:plc:ccc')

    // Request with cursor to get items after 'did:plc:aaa'
    const res = await app.request('/repos/did:plc:aaa', {
        headers: {
            'Authorization': 'Basic ' + Buffer
                .from('admin:secret123')
                .toString('base64')
        }
    })

    t.equal(res.status, 200, 'should return 200')
    const body = await res.json()
    t.equal(body.dids.length, 2, 'should return 2 dids after cursor')
    t.ok(!body.dids.includes('did:plc:aaa'), 'should not include cursor did')
    t.ok(body.dids.includes('did:plc:bbb'), 'should include bbb')
    t.ok(body.dids.includes('did:plc:ccc'), 'should include ccc')

    db.close()
})

test('/repos returns empty array when no repos exist', async (t) => {
    const db = setupTestDb()
    const app = createApp({ db, adminPassword: 'secret123' })

    const res = await app.request('/repos', {
        headers: {
            'Authorization': 'Basic ' + Buffer
                .from('admin:secret123')
                .toString('base64')
        }
    })

    t.equal(res.status, 200, 'should return 200')
    const body = await res.json()
    t.equal(body.dids.length, 0, 'should return empty array')
    t.equal(body.cursor, null, 'cursor should be null')

    db.close()
})
