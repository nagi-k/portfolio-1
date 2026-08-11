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

async function ensureSchema(pg) {
  try {
    await pg.executePGSql({
      Sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS glb_model_url TEXT',
      Role: 'cloudbase_postgres',
    })
    await pg.executePGSql({
      Sql: `CREATE TABLE IF NOT EXISTS homepage_3d (
        id SERIAL PRIMARY KEY,
        models JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      Role: 'cloudbase_postgres',
    })
  } catch (err) {
    console.warn('⚠ ensureSchema warning:', err.message)
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

  // 自动补全数据库表/字段（云函数部署后可能尚未被触发执行 ensureTables）
  await ensureSchema(pg)

  const [projectsRes, siteRes, aboutRes, homepage3dRes] = await Promise.all([
    pg.executePGSql({ Sql: 'SELECT * FROM projects ORDER BY "order" ASC, id ASC', Role: 'cloudbase_postgres' }),
    pg.executePGSql({ Sql: 'SELECT * FROM site LIMIT 1', Role: 'cloudbase_postgres' }),
    pg.executePGSql({ Sql: 'SELECT * FROM about LIMIT 1', Role: 'cloudbase_postgres' }),
    pg.executePGSql({ Sql: 'SELECT * FROM homepage_3d LIMIT 1', Role: 'cloudbase_postgres' }),
  ])

  const projects = (projectsRes.Rows || []).map((s) => normalizeProject(JSON.parse(s))).filter((p) => !p.hidden)
  const siteRows = (siteRes.Rows || []).map((s) => normalizeSite(JSON.parse(s)))
  const aboutRows = (aboutRes.Rows || []).map((s) => normalizeAbout(JSON.parse(s)))
  const homepage3dRows = (homepage3dRes.Rows || []).map((s) => JSON.parse(s))
  const homepage3dModels = homepage3dRows.length
    ? (typeof homepage3dRows[0][1] === 'string' ? JSON.parse(homepage3dRows[0][1]) : homepage3dRows[0][1] || [])
    : []

  return {
    projects,
    site: siteRows[0] || {},
    about: aboutRows[0] || {},
    homepage3d: homepage3dModels,
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
      return { ...data, slug, body, glbModelUrl: data.glbModelUrl || '' }
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
    homepage3d: [],
  }
}

function writeProject2Config(projects) {
  const project2 = projects.find((p) => p.customPage === '/hmi-projects/project2-unity-hmi.html')
  const configDir = path.join(process.cwd(), 'public', 'hmi-projects', 'config')
  const configPath = path.join(configDir, 'project2.json')
  const config = {
    glbUrl: project2?.glbModelUrl || '/hmi-projects/assets/test-model.glb',
    updatedAt: new Date().toISOString(),
  }
  fs.mkdirSync(configDir, { recursive: true })
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  console.log(`✓ Wrote project2 config: ${config.glbUrl}`)
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
    data.homepage3d = []
    console.log(`✓ Loaded ${data.projects.length} projects from markdown`)
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2))

  // 为 HMI 项目二生成 GLB 配置文件
  writeProject2Config(data.projects || [])
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
