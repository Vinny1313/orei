import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')
const dbPath = path.join(dataDir, 'orei-db.json')
const port = Number(process.env.PORT || 3333)
const sessionSecret = process.env.SESSION_SECRET || 'orei-local-dev-secret'
const maxBodyBytes = 1_000_000

const emptyDb = { users: [], sheets: [] }

async function readDb() {
  try {
    return JSON.parse(await readFile(dbPath, 'utf8'))
  } catch {
    await mkdir(dataDir, { recursive: true })
    await writeFile(dbPath, JSON.stringify(emptyDb, null, 2))
    return structuredClone(emptyDb)
  }
}

async function writeDb(db) {
  await mkdir(dataDir, { recursive: true })
  await writeFile(dbPath, JSON.stringify(db, null, 2))
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

function error(res, status, code, message) {
  send(res, status, { error: { code, message } })
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':')
  const candidate = scryptSync(password, salt, 64)
  return timingSafeEqual(Buffer.from(hash, 'hex'), candidate)
}

function sign(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', sessionSecret).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

function verifyToken(token) {
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null
  const expected = createHmac('sha256', sessionSecret).update(encoded).digest('base64url')
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  if (payload.exp < Date.now()) return null
  return payload
}

function getBearer(req) {
  const header = req.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

async function parseBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > maxBodyBytes) throw new Error('Payload grande demais.')
    chunks.push(chunk)
  }
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function publicUser(user) {
  return { id: user.id, email: user.email, createdAt: user.createdAt }
}

function publicSheet(sheet) {
  return {
    id: sheet.id,
    name: sheet.name,
    payload: sheet.payload,
    version: sheet.version,
    createdAt: sheet.createdAt,
    updatedAt: sheet.updatedAt,
  }
}

function sheetName(payload) {
  const name = payload?.identity?.characterName
  return typeof name === 'string' && name.trim() ? name.trim() : 'Ficha sem nome'
}

async function requireUser(req, res, db) {
  const payload = verifyToken(getBearer(req))
  const user = payload && db.users.find((entry) => entry.id === payload.sub)
  if (!user) {
    error(res, 401, 'unauthorized', 'Faça login para continuar.')
    return null
  }
  return user
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (!url.pathname.startsWith('/api/')) {
    error(res, 404, 'not_found', 'Rota não encontrada.')
    return
  }

  try {
    const db = await readDb()

    if (req.method === 'POST' && url.pathname === '/api/auth/register') {
      const { email, password } = await parseBody(req)
      const normalizedEmail = String(email || '').trim().toLowerCase()
      if (!normalizedEmail.includes('@') || String(password || '').length < 6) {
        error(res, 400, 'invalid_credentials', 'Use um e-mail válido e senha com pelo menos 6 caracteres.')
        return
      }
      if (db.users.some((user) => user.email === normalizedEmail)) {
        error(res, 409, 'email_taken', 'Este e-mail já está cadastrado.')
        return
      }
      const now = new Date().toISOString()
      const user = {
        id: randomBytes(16).toString('hex'),
        email: normalizedEmail,
        passwordHash: hashPassword(String(password)),
        createdAt: now,
        updatedAt: now,
      }
      db.users.push(user)
      await writeDb(db)
      send(res, 201, { token: sign({ sub: user.id, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }), user: publicUser(user) })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
      const { email, password } = await parseBody(req)
      const user = db.users.find((entry) => entry.email === String(email || '').trim().toLowerCase())
      if (!user || !verifyPassword(String(password || ''), user.passwordHash)) {
        error(res, 401, 'invalid_login', 'E-mail ou senha inválidos.')
        return
      }
      send(res, 200, { token: sign({ sub: user.id, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }), user: publicUser(user) })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/me') {
      const user = await requireUser(req, res, db)
      if (!user) return
      send(res, 200, { user: publicUser(user) })
      return
    }

    const user = await requireUser(req, res, db)
    if (!user) return

    if (req.method === 'GET' && url.pathname === '/api/sheets') {
      send(res, 200, {
        sheets: db.sheets
          .filter((sheet) => sheet.userId === user.id)
          .map(publicSheet)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/sheets') {
      const { payload } = await parseBody(req)
      if (!payload || typeof payload !== 'object') {
        error(res, 400, 'invalid_sheet', 'Envie uma ficha JSON válida.')
        return
      }
      const now = new Date().toISOString()
      const sheet = {
        id: randomBytes(16).toString('hex'),
        userId: user.id,
        name: sheetName(payload),
        payload,
        version: 1,
        createdAt: now,
        updatedAt: now,
      }
      db.sheets.push(sheet)
      await writeDb(db)
      send(res, 201, { sheet: publicSheet(sheet) })
      return
    }

    const sheetMatch = url.pathname.match(/^\/api\/sheets\/([a-f0-9]+)$/)
    if (sheetMatch) {
      const sheet = db.sheets.find((entry) => entry.id === sheetMatch[1] && entry.userId === user.id)
      if (!sheet) {
        error(res, 404, 'sheet_not_found', 'Ficha não encontrada.')
        return
      }

      if (req.method === 'GET') {
        send(res, 200, { sheet: publicSheet(sheet) })
        return
      }

      if (req.method === 'PUT') {
        const { payload } = await parseBody(req)
        if (!payload || typeof payload !== 'object') {
          error(res, 400, 'invalid_sheet', 'Envie uma ficha JSON válida.')
          return
        }
        sheet.payload = payload
        sheet.name = sheetName(payload)
        sheet.version += 1
        sheet.updatedAt = new Date().toISOString()
        await writeDb(db)
        send(res, 200, { sheet: publicSheet(sheet) })
        return
      }

      if (req.method === 'DELETE') {
        db.sheets = db.sheets.filter((entry) => entry.id !== sheet.id)
        await writeDb(db)
        send(res, 200, { ok: true })
        return
      }
    }

    error(res, 404, 'not_found', 'Rota não encontrada.')
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Erro inesperado.'
    error(res, 500, 'server_error', message)
  }
})

server.listen(port, () => {
  console.log(`O Rei Mandou API em http://localhost:${port}`)
})
