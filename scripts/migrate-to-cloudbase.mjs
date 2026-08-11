import CloudBase from '@cloudbase/manager-node'
import fs from 'fs'
import path from 'path'

const secretId = process.env.CLOUDBASE_SECRET_ID || process.env.TCB_SECRET_ID
const secretKey = process.env.CLOUDBASE_SECRET_KEY || process.env.TCB_SECRET_KEY
const envId = process.env.CLOUDBASE_ENV_ID || process.env.TCB_ENV_ID

if (!envId || !secretId || !secretKey) {
  console.error('请设置环境变量：CLOUDBASE_SECRET_ID / CLOUDBASE_SECRET_KEY / CLOUDBASE_ENV_ID')
  process.exit(1)
}

const app = CloudBase.init({
  secretId,
  secretKey,
  envId,
  region: 'ap-shanghai',
})
const pg = app.database

const dataPath = path.join(process.cwd(), 'content', 'data.json')
if (!fs.existsSync(dataPath)) {
  console.error(`找不到 ${dataPath}，请先运行 npm run fetch-content 或确认文件存在`)
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

function pgEscape(val) {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (typeof val === 'number') return String(val)
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`
  return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`
}

async function pgExec(sql) {
  await pg.executePGSql({ Sql: sql, Role: 'cloudbase_postgres' })
}

async function pgQuery(sql) {
  const res = await pg.executePGSql({ Sql: sql, Role: 'cloudbase_postgres' })
  return res.Rows ? res.Rows.map((s) => JSON.parse(s)) : []
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
      body TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
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
  console.log('  数据表已创建或已存在')
}

async function migrateProjects(projects) {
  console.log(`迁移 ${projects.length} 个作品...`)
  for (const p of projects) {
    const payload = { ...p }
    delete payload._id
    delete payload.id
    const slug = (payload.slug || payload.title || `project-${Date.now()}`).toString().trim()
    payload.slug = slug
    const existing = await pgQuery(`SELECT id FROM projects WHERE slug = ${pgEscape(slug)}`)
    if (existing.length > 0) {
      await pgExec(`
        UPDATE projects SET
          title = ${pgEscape(payload.title || '')},
          year = ${pgEscape(payload.year || '')},
          category = ${pgEscape(payload.category || '工业设计')},
          cover = ${pgEscape(payload.cover || '')},
          excerpt = ${pgEscape(payload.excerpt || '')},
          tags = ${pgEscape(payload.tags || [])},
          role = ${pgEscape(payload.role || '')},
          client = ${pgEscape(payload.client || '')},
          featured = ${pgEscape(!!payload.featured)},
          hidden = ${pgEscape(!!payload.hidden)},
          "order" = ${pgEscape(Number(payload.order) || 99)},
          custom_page = ${pgEscape(payload.customPage || payload.custom_page || '')},
          body = ${pgEscape(payload.body || '')},
          updated_at = CURRENT_TIMESTAMP
        WHERE slug = ${pgEscape(slug)}
      `)
      console.log(`  更新 ${slug}`)
    } else {
      await pgExec(`
        INSERT INTO projects (slug, title, year, category, cover, excerpt, tags, role, client, featured, hidden, "order", custom_page, body)
        VALUES (
          ${pgEscape(slug)}, ${pgEscape(payload.title || '')}, ${pgEscape(payload.year || '')}, ${pgEscape(payload.category || '工业设计')},
          ${pgEscape(payload.cover || '')}, ${pgEscape(payload.excerpt || '')}, ${pgEscape(payload.tags || [])}, ${pgEscape(payload.role || '')},
          ${pgEscape(payload.client || '')}, ${pgEscape(!!payload.featured)}, ${pgEscape(!!payload.hidden)}, ${pgEscape(Number(payload.order) || 99)},
          ${pgEscape(payload.customPage || payload.custom_page || '')}, ${pgEscape(payload.body || '')}
        )
      `)
      console.log(`  新增 ${slug}`)
    }
  }
}

async function migrateSite(site) {
  if (!site) return
  console.log('迁移站点信息...')
  const payload = { ...site }
  delete payload._id
  delete payload.id
  delete payload.body
  const rows = await pgQuery('SELECT id FROM site LIMIT 1')
  if (rows.length) {
    await pgExec(`
      UPDATE site SET
        name = ${pgEscape(payload.name || '')},
        role = ${pgEscape(payload.role || '')},
        tagline = ${pgEscape(payload.tagline || '')},
        intro = ${pgEscape(payload.intro || '')},
        email = ${pgEscape(payload.email || '')},
        location = ${pgEscape(payload.location || '')},
        socials = ${pgEscape(payload.socials || [])},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${pgEscape(rows[0][0])}
    `)
    console.log('  更新 site')
  } else {
    await pgExec(`
      INSERT INTO site (name, role, tagline, intro, email, location, socials)
      VALUES (
        ${pgEscape(payload.name || '')}, ${pgEscape(payload.role || '')}, ${pgEscape(payload.tagline || '')},
        ${pgEscape(payload.intro || '')}, ${pgEscape(payload.email || '')}, ${pgEscape(payload.location || '')},
        ${pgEscape(payload.socials || [])}
      )
    `)
    console.log('  新增 site')
  }
}

async function migrateAbout(about) {
  if (!about) return
  console.log('迁移关于我...')
  const payload = { ...about }
  delete payload._id
  delete payload.id
  const rows = await pgQuery('SELECT id FROM about LIMIT 1')
  if (rows.length) {
    await pgExec(`
      UPDATE about SET
        portrait = ${pgEscape(payload.portrait || '')},
        skills = ${pgEscape(payload.skills || [])},
        body = ${pgEscape(payload.body || '')},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${pgEscape(rows[0][0])}
    `)
    console.log('  更新 about')
  } else {
    await pgExec(`
      INSERT INTO about (portrait, skills, body)
      VALUES (${pgEscape(payload.portrait || '')}, ${pgEscape(payload.skills || [])}, ${pgEscape(payload.body || '')})
    `)
    console.log('  新增 about')
  }
}

async function main() {
  console.log('检查数据表...')
  await ensureTables()

  await migrateProjects(data.projects || [])
  await migrateSite(data.site)
  await migrateAbout(data.about)

  console.log('迁移完成')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
