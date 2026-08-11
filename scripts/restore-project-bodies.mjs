import CloudBase from '@cloudbase/manager-node'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const secretId = process.env.CLOUDBASE_SECRET_ID || process.env.TCB_SECRET_ID
const secretKey = process.env.CLOUDBASE_SECRET_KEY || process.env.TCB_SECRET_KEY
const envId = process.env.CLOUDBASE_ENV_ID || process.env.TCB_ENV_ID

if (!envId || !secretId || !secretKey) {
  console.error('Missing CloudBase credentials')
  process.exit(1)
}

const app = CloudBase.init({
  secretId,
  secretKey,
  envId,
  region: 'ap-shanghai',
})

const pg = app.database

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, body: raw }
  return { data: yaml.load(match[1]), body: match[2].trim() }
}

function pgEscape(val) {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (typeof val === 'number') return String(val)
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`
  return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`
}

async function main() {
  const projectsDir = path.join(process.cwd(), 'content', 'projects')
  const files = fs.readdirSync(projectsDir).filter((f) => f.endsWith('.md'))

  for (const file of files) {
    const raw = fs.readFileSync(path.join(projectsDir, file), 'utf8')
    const { data, body } = parseFrontmatter(raw)
    const slug = file.replace(/\.md$/, '')

    if (!body) {
      console.log(`⚠ Skipping ${slug}: empty body in markdown`)
      continue
    }

    await pg.executePGSql({
      Sql: `UPDATE projects SET body = ${pgEscape(body)}, updated_at = CURRENT_TIMESTAMP WHERE slug = ${pgEscape(slug)}`,
      Role: 'cloudbase_postgres',
    })
    console.log(`✓ Restored body for ${slug} (${body.length} chars)`)
  }

  console.log('\nDone. Please redeploy the site to refresh static content.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
