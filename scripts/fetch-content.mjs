import cloudbase from '@cloudbase/node-sdk'
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

async function fetchFromCloudBase() {
  if (!secretId || !secretKey || !envId) {
    throw new Error('Missing CloudBase credentials')
  }

  const app = cloudbase.init({
    env: envId,
    secretId,
    secretKey,
  })

  const db = app.database()

  const [{ data: projects }, { data: siteDocs }, { data: aboutDocs }] = await Promise.all([
    db.collection('projects').orderBy('order', 'asc').get(),
    db.collection('site').limit(1).get(),
    db.collection('about').limit(1).get(),
  ])

  return {
    projects: projects.filter((p) => !p.hidden),
    site: siteDocs[0] || {},
    about: aboutDocs[0] || {},
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
    console.log(`✓ Fetched ${data.projects.length} projects from CloudBase`)
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
