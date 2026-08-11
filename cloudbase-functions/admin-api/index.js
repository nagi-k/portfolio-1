const CloudBase = require('@cloudbase/manager-node')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const https = require('https')

// ─────────────────────────────────────────────
// 环境变量
// ─────────────────────────────────────────────
const ENV_ID = process.env.TCB_ENV_ID
const SECRET_ID = process.env.TCB_SECRET_ID
const SECRET_KEY = process.env.TCB_SECRET_KEY
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const JWT_SECRET = process.env.JWT_SECRET
const GH_TOKEN = process.env.GH_TOKEN
const GH_REPO = process.env.GH_REPO
const GH_WORKFLOW_ID = process.env.GH_WORKFLOW_ID || 'deploy-cloudbase.yml'
const GH_REF = process.env.GH_REF || 'main'

let app
let pg
let storage

function initCloudBase() {
  if (!app) {
    app = CloudBase.init({
      secretId: SECRET_ID,
      secretKey: SECRET_KEY,
      envId: ENV_ID,
      region: 'ap-shanghai',
    })
    pg = app.database
    storage = app.storage
  }
}

// ─────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-deploy-secret',
    'Access-Control-Max-Age': '86400',
  }
}

function response(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
    body: JSON.stringify(body),
  }
}

function signJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const b = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${b}`).digest('base64url')
  return `${header}.${b}.${signature}`
}

function verifyJwt(token) {
  try {
    const [header, body, signature] = token.split('.')
    if (!header || !body || !signature) return null
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url')
    if (signature !== expected) return null
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (payload.exp && payload.exp < Date.now() / 1000) return null
    return payload
  } catch (e) {
    return null
  }
}

function pgEscape(val) {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (typeof val === 'number') return String(val)
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`
  return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`
}

async function pgQuery(sql) {
  const res = await pg.executePGSql({ Sql: sql, Role: 'cloudbase_postgres' })
  return res.Rows ? res.Rows.map((s) => JSON.parse(s)) : []
}

async function pgExec(sql) {
  await pg.executePGSql({ Sql: sql, Role: 'cloudbase_postgres' })
}

async function ensureTables() {
  await pgExec(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      year TEXT,
      category TEXT,
      cover TEXT,
      excerpt TEXT,
      tags JSONB DEFAULT '[]'::jsonb,
      role TEXT,
      client TEXT,
      featured BOOLEAN DEFAULT FALSE,
      hidden BOOLEAN DEFAULT FALSE,
      "order" INTEGER DEFAULT 99,
      custom_page TEXT,
      glb_model_url TEXT,
      body TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  // 兼容旧表：补充 glb_model_url 字段
  try {
    await pgExec(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS glb_model_url TEXT`)
  } catch (e) {
    console.log('add glb_model_url column:', e.message)
  }
  await pgExec(`
    CREATE TABLE IF NOT EXISTS site (
      id SERIAL PRIMARY KEY,
      name TEXT,
      role TEXT,
      tagline TEXT,
      intro TEXT,
      email TEXT,
      location TEXT,
      socials JSONB DEFAULT '[]'::jsonb,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pgExec(`
    CREATE TABLE IF NOT EXISTS about (
      id SERIAL PRIMARY KEY,
      portrait TEXT,
      skills JSONB DEFAULT '[]'::jsonb,
      body TEXT DEFAULT '',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pgExec(`
    CREATE TABLE IF NOT EXISTS homepage_3d (
      id SERIAL PRIMARY KEY,
      models JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

function toBool(val) {
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') return val.toLowerCase() === 'true' || val === 't'
  return !!val
}

function normalizeProject(row) {
  return {
    id: Number(row[0]),
    slug: row[1],
    title: row[2],
    year: row[3],
    category: row[4],
    cover: row[5],
    excerpt: row[6],
    tags: typeof row[7] === 'string' ? JSON.parse(row[7]) : row[7] || [],
    role: row[8],
    client: row[9],
    featured: toBool(row[10]),
    hidden: toBool(row[11]),
    order: Number(row[12]),
    customPage: row[13],
    glbModelUrl: row[14] || '',
    body: row[15],
  }
}

function normalizeSite(row) {
  return {
    id: Number(row[0]),
    name: row[1],
    role: row[2],
    tagline: row[3],
    intro: row[4],
    email: row[5],
    location: row[6],
    socials: typeof row[7] === 'string' ? JSON.parse(row[7]) : row[7] || [],
  }
}

function normalizeAbout(row) {
  return {
    id: Number(row[0]),
    portrait: row[1],
    skills: typeof row[2] === 'string' ? JSON.parse(row[2]) : row[2] || [],
    body: row[3],
  }
}

function getPath(event) {
  const p = event.path || ''
  return p.replace(/^\/admin-api/, '')
}

function getBody(event) {
  if (!event.body) return {}
  const raw = typeof event.body === 'string' ? event.body : JSON.stringify(event.body)
  try {
    return JSON.parse(raw)
  } catch (e) {
    return {}
  }
}

function checkAuth(headers) {
  const auth = headers && (headers.Authorization || headers.authorization)
  if (!auth) return null
  const token = auth.replace(/^Bearer\s+/i, '')
  return verifyJwt(token)
}

async function triggerDeploy() {
  if (!GH_TOKEN || !GH_REPO) {
    throw new Error('Missing GH_TOKEN or GH_REPO')
  }
  const [owner, repo] = GH_REPO.split('/')
  if (!owner || !repo) {
    throw new Error('Invalid GH_REPO format')
  }
  const apiPath = `/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(GH_WORKFLOW_ID)}/dispatches`
  const postData = JSON.stringify({ ref: GH_REF })
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.github.com',
        path: apiPath,
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${GH_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'cloudbase-admin-api',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 15000,
      },
      (res) => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => {
          if (res.statusCode === 204) {
            resolve({ ok: true })
          } else {
            reject(new Error(`GitHub API ${res.statusCode}: ${body}`))
          }
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('GitHub API timeout'))
    })
    req.write(postData)
    req.end()
  })
}

async function uploadBase64(cloudPath, base64Data) {
  const match = base64Data.match(/^data:([\w\/\+]+);base64,(.*)$/)
  const buffer = match ? Buffer.from(match[2], 'base64') : Buffer.from(base64Data, 'base64')
  const tmpFile = path.join('/tmp', `${Date.now()}-${path.basename(cloudPath)}`)
  fs.writeFileSync(tmpFile, buffer)
  try {
    const res = await storage.uploadFile({ localPath: tmpFile, cloudPath })
    return res
  } finally {
    try {
      fs.unlinkSync(tmpFile)
    } catch (e) {}
  }
}

function assetUrl(cloudPath) {
  // 统一返回以 / 开头的相对路径，与前台 resolveAsset 兼容
  const normalized = cloudPath.startsWith('/') ? cloudPath : `/${cloudPath}`
  return normalized
}

// ─────────────────────────────────────────────
// 主入口
// ─────────────────────────────────────────────
exports.main = async (event, context) => {
  initCloudBase()

  const origin = event.headers && (event.headers.origin || event.headers.Origin)
  const cors = corsHeaders(origin)

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' }
  }

  if (!ENV_ID || !SECRET_ID || !SECRET_KEY || !ADMIN_PASSWORD || !JWT_SECRET) {
    return response(500, { error: 'Server configuration missing' }, cors)
  }

  try {
    await ensureTables()
  } catch (err) {
    console.error('ensureTables error:', err.message)
    return response(500, { error: `Database init failed: ${err.message}` }, cors)
  }

  const reqPath = getPath(event)
  const method = event.httpMethod
  const body = getBody(event)

  try {
    // 健康检查
    if (method === 'GET' && reqPath === '/health') {
      return response(200, { ok: true }, cors)
    }

    // 登录
    if (method === 'POST' && reqPath === '/auth/login') {
      if (body.password !== ADMIN_PASSWORD) {
        return response(401, { error: '密码错误' }, cors)
      }
      const token = signJwt({ admin: true, exp: Math.floor(Date.now() / 1000) + 86400 })
      return response(200, { token }, cors)
    }

    // 以下接口需要鉴权
    const authPayload = checkAuth(event.headers)
    if (!authPayload) {
      return response(401, { error: '未登录或登录已过期' }, cors)
    }

    // ── upload ──
    if (method === 'POST' && reqPath === '/upload') {
      const { cloudPath, data } = body
      if (!cloudPath || !data) {
        return response(400, { error: '缺少 cloudPath 或 data' }, cors)
      }
      // 安全校验：只允许上传到 images/uploads/、models/、hmi-projects/assets/
      const safePath = cloudPath.replace(/^\/+/, '')
      const allowedPrefixes = ['images/uploads/', 'models/', 'hmi-projects/assets/']
      const allowed = allowedPrefixes.some((prefix) => safePath.startsWith(prefix))
      if (!allowed) {
        return response(400, { error: '只能上传到 images/uploads/、models/ 或 hmi-projects/assets/ 目录' }, cors)
      }
      await uploadBase64(safePath, data)
      return response(200, { ok: true, url: assetUrl(safePath), cloudPath: safePath }, cors)
    }

    // ── projects ──
    if (method === 'GET' && reqPath === '/projects') {
      const rows = await pgQuery('SELECT * FROM projects ORDER BY "order" ASC, id ASC')
      return response(200, { projects: rows.map(normalizeProject) }, cors)
    }

    if (method === 'GET' && reqPath.startsWith('/projects/')) {
      const slug = reqPath.replace('/projects/', '')
      const rows = await pgQuery(`SELECT * FROM projects WHERE slug = ${pgEscape(slug)}`)
      if (!rows.length) return response(404, { error: '作品不存在' }, cors)
      return response(200, { project: normalizeProject(rows[0]) }, cors)
    }

    if (method === 'POST' && reqPath === '/projects') {
      const p = body
      if (!p.slug || !p.title) {
        return response(400, { error: 'slug 和 title 必填' }, cors)
      }
      const existing = await pgQuery(`SELECT id FROM projects WHERE slug = ${pgEscape(p.slug)}`)
      if (existing.length) {
        return response(409, { error: 'slug 已存在' }, cors)
      }
      await pgExec(`
        INSERT INTO projects (slug, title, year, category, cover, excerpt, tags, role, client, featured, hidden, "order", custom_page, glb_model_url, body)
        VALUES (
          ${pgEscape(p.slug)}, ${pgEscape(p.title)}, ${pgEscape(p.year || '')}, ${pgEscape(p.category || '工业设计')},
          ${pgEscape(p.cover || '')}, ${pgEscape(p.excerpt || '')}, ${pgEscape(p.tags || [])}, ${pgEscape(p.role || '')},
          ${pgEscape(p.client || '')}, ${pgEscape(!!p.featured)}, ${pgEscape(!!p.hidden)}, ${pgEscape(Number(p.order) || 99)},
          ${pgEscape(p.customPage || '')}, ${pgEscape(p.glbModelUrl || '')}, ${pgEscape(p.body || '')}
        )
      `)
      return response(200, { ok: true, slug: p.slug }, cors)
    }

    if (method === 'PUT' && reqPath.startsWith('/projects/')) {
      const slug = reqPath.replace('/projects/', '')
      const p = body
      await pgExec(`
        UPDATE projects SET
          title = ${pgEscape(p.title)},
          year = ${pgEscape(p.year || '')},
          category = ${pgEscape(p.category || '工业设计')},
          cover = ${pgEscape(p.cover || '')},
          excerpt = ${pgEscape(p.excerpt || '')},
          tags = ${pgEscape(p.tags || [])},
          role = ${pgEscape(p.role || '')},
          client = ${pgEscape(p.client || '')},
          featured = ${pgEscape(!!p.featured)},
          hidden = ${pgEscape(!!p.hidden)},
          "order" = ${pgEscape(Number(p.order) || 99)},
          custom_page = ${pgEscape(p.customPage || '')},
          glb_model_url = ${pgEscape(p.glbModelUrl || '')},
          body = ${pgEscape(p.body || '')},
          updated_at = CURRENT_TIMESTAMP
        WHERE slug = ${pgEscape(slug)}
      `)
      return response(200, { ok: true, slug }, cors)
    }

    if (method === 'DELETE' && reqPath.startsWith('/projects/')) {
      const slug = reqPath.replace('/projects/', '')
      await pgExec(`DELETE FROM projects WHERE slug = ${pgEscape(slug)}`)
      return response(200, { ok: true }, cors)
    }

    // ── site ──
    if (method === 'GET' && reqPath === '/site') {
      const rows = await pgQuery('SELECT * FROM site LIMIT 1')
      return response(200, { site: rows.length ? normalizeSite(rows[0]) : {} }, cors)
    }

    if (method === 'PUT' && reqPath === '/site') {
      const s = body
      const rows = await pgQuery('SELECT id FROM site LIMIT 1')
      if (rows.length) {
        await pgExec(`
          UPDATE site SET
            name = ${pgEscape(s.name || '')},
            role = ${pgEscape(s.role || '')},
            tagline = ${pgEscape(s.tagline || '')},
            intro = ${pgEscape(s.intro || '')},
            email = ${pgEscape(s.email || '')},
            location = ${pgEscape(s.location || '')},
            socials = ${pgEscape(s.socials || [])},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${pgEscape(rows[0][0])}
        `)
      } else {
        await pgExec(`
          INSERT INTO site (name, role, tagline, intro, email, location, socials)
          VALUES (
            ${pgEscape(s.name || '')}, ${pgEscape(s.role || '')}, ${pgEscape(s.tagline || '')},
            ${pgEscape(s.intro || '')}, ${pgEscape(s.email || '')}, ${pgEscape(s.location || '')},
            ${pgEscape(s.socials || [])}
          )
        `)
      }
      return response(200, { ok: true }, cors)
    }

    // ── about ──
    if (method === 'GET' && reqPath === '/about') {
      const rows = await pgQuery('SELECT * FROM about LIMIT 1')
      return response(200, { about: rows.length ? normalizeAbout(rows[0]) : {} }, cors)
    }

    if (method === 'PUT' && reqPath === '/about') {
      const a = body
      const rows = await pgQuery('SELECT id FROM about LIMIT 1')
      if (rows.length) {
        await pgExec(`
          UPDATE about SET
            portrait = ${pgEscape(a.portrait || '')},
            skills = ${pgEscape(a.skills || [])},
            body = ${pgEscape(a.body || '')},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${pgEscape(rows[0][0])}
        `)
      } else {
        await pgExec(`
          INSERT INTO about (portrait, skills, body)
          VALUES (${pgEscape(a.portrait || '')}, ${pgEscape(a.skills || [])}, ${pgEscape(a.body || '')})
        `)
      }
      return response(200, { ok: true }, cors)
    }

    // ── homepage 3D models ──
    if (method === 'GET' && reqPath === '/homepage-3d') {
      const rows = await pgQuery('SELECT * FROM homepage_3d LIMIT 1')
      const models = rows.length ? (typeof rows[0][1] === 'string' ? JSON.parse(rows[0][1]) : rows[0][1] || []) : []
      return response(200, { models }, cors)
    }

    if (method === 'PUT' && reqPath === '/homepage-3d') {
      const models = Array.isArray(body.models) ? body.models : []
      const rows = await pgQuery('SELECT id FROM homepage_3d LIMIT 1')
      if (rows.length) {
        await pgExec(`
          UPDATE homepage_3d SET models = ${pgEscape(models)}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${pgEscape(rows[0][0])}
        `)
      } else {
        await pgExec(`INSERT INTO homepage_3d (models) VALUES (${pgEscape(models)})`)
      }
      return response(200, { ok: true }, cors)
    }

    // ── deploy ──
    if (method === 'POST' && reqPath === '/deploy') {
      await triggerDeploy()
      return response(200, { ok: true, message: '部署已触发' }, cors)
    }

    return response(404, { error: '接口不存在' }, cors)
  } catch (err) {
    console.error('admin-api error:', err.message, err.stack)
    return response(500, { error: err.message }, cors)
  }
}
