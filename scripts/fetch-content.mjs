import CloudBase from '@cloudbase/manager-node'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const secretId = process.env.CLOUDBASE_SECRET_ID || process.env.TCB_SECRET_ID
const secretKey = process.env.CLOUDBASE_SECRET_KEY || process.env.TCB_SECRET_KEY
const envId = process.env.CLOUDBASE_ENV_ID || process.env.TCB_ENV_ID

const outPath = path.join(process.cwd(), 'content', 'data.json')

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, body: raw }
  return { data: yaml.load(match[1]), body: match[2].trim() }
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
    body: row[14],
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

async function fetchFromCloudBase() {
  if (!envId || !secretId || !secretKey) {
    throw new Error('Missing CloudBase credentials')
  }

  const app = CloudBase.init({
    secretId,
    secretKey,
    envId,
    region: 'ap-shanghai',
  })

  const pg = app.database

  const [projectsRes, siteRes, aboutRes] = await Promise.all([
    pg.executePGSql({ Sql: 'SELECT * FROM projects ORDER BY "order" ASC, id ASC', Role: 'cloudbase_postgres' }),
    pg.executePGSql({ Sql: 'SELECT * FROM site LIMIT 1', Role: 'cloudbase_postgres' }),
    pg.executePGSql({ Sql: 'SELECT * FROM about LIMIT 1', Role: 'cloudbase_postgres' }),
  ])

  const projects = (projectsRes.Rows || []).map((s) => normalizeProject(JSON.parse(s))).filter((p) => !p.hidden)
  const siteRows = (siteRes.Rows || []).map((s) => normalizeSite(JSON.parse(s)))
  const aboutRows = (aboutRes.Rows || []).map((s) => normalizeAbout(JSON.parse(s)))

  return {
    projects,
    site: siteRows[0] || {},
    about: aboutRows[0] || {},
  }
}

function fetchFromMarkdown() {
  const projectsDir = path.join(process.cwd(), 'content', 'projects')
  const pagesDir = path.join(process.cwd(), 'content', 'pages')

  const projects = fs.readdirSync(projectsDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(projectsDir, f), 'utf8')
      const { data, body } = parseFrontmatter(raw)
      const slug = f.replace(/\.md$/, '')
      return { ...data, slug, body }
    })
    .filter((p) => !p.hidden)
    .sort((a, b) => a.order - b.order)

  function loadPage(name) {
    const file = path.join(pagesDir, `${name}.md`)
    if (!fs.existsSync(file)) return {}
    const raw = fs.readFileSync(file, 'utf8')
    const { data, body } = parseFrontmatter(raw)
    return { ...data, body }
  }

  return {
    projects,
    site: loadPage('site'),
    about: loadPage('about'),
  }
}

async function main() {
  let data

  try {
    data = await fetchFromCloudBase()
    console.log(`✓ Fetched ${data.projects.length} projects from CloudBase PostgreSQL`)
  } catch (err) {
    if (process.env.CI) {
      console.error('✗ CloudBase fetch failed in CI:', err.message)
      process.exit(1)
    }
    console.warn('⚠ CloudBase fetch failed, falling back to markdown:', err.message)
    data = fetchFromMarkdown()
    console.log(`✓ Loaded ${data.projects.length} projects from markdown`)
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
