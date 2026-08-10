import cloudbase from '@cloudbase/node-sdk'
import fs from 'fs'
import path from 'path'

const secretId = process.env.CLOUDBASE_SECRET_ID || process.env.TCB_SECRET_ID
let secretKey = process.env.CLOUDBASE_SECRET_KEY || process.env.TCB_SECRET_KEY
const envId = process.env.CLOUDBASE_ENV_ID || process.env.TCB_ENV_ID
const accessKey = process.env.CLOUDBASE_ACCESS_KEY || (secretKey && secretKey.startsWith('eyJ') ? secretKey : undefined)
if (accessKey) secretKey = undefined

if (!envId || (!accessKey && (!secretId || !secretKey))) {
  console.error('请设置环境变量：CLOUDBASE_SECRET_ID / CLOUDBASE_SECRET_KEY / CLOUDBASE_ENV_ID，或传入 CLOUDBASE_ACCESS_KEY')
  process.exit(1)
}

const app = cloudbase.init({
  env: envId,
  ...(accessKey ? { accessKey } : { secretId, secretKey }),
  proxy: process.env.HTTPS_PROXY || process.env.https_proxy || undefined,
  timeout: 30000,
})
const db = app.database()

const dataPath = path.join(process.cwd(), 'content', 'data.json')
if (!fs.existsSync(dataPath)) {
  console.error(`找不到 ${dataPath}，请先运行 npm run fetch-content 或确认文件存在`)
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

async function upsertSingle(collection, payload) {
  const { data: docs } = await db.collection(collection).limit(1).get()
  if (docs.length > 0) {
    await db.collection(collection).doc(docs[0]._id).update(payload)
    console.log(`  更新 ${collection}（_id=${docs[0]._id}）`)
  } else {
    const res = await db.collection(collection).add(payload)
    console.log(`  新增 ${collection}（_id=${res.id}）`)
  }
}

async function migrateProjects(projects) {
  console.log(`迁移 ${projects.length} 个作品...`)
  for (const p of projects) {
    const payload = { ...p }
    delete payload._id
    const { data: existing } = await db.collection('projects').where({ slug: payload.slug }).limit(1).get()
    if (existing.length > 0) {
      await db.collection('projects').doc(existing[0]._id).update(payload)
      console.log(`  更新 ${payload.slug}`)
    } else {
      const res = await db.collection('projects').add(payload)
      console.log(`  新增 ${payload.slug}（_id=${res.id}）`)
    }
  }
}

async function main() {
  await migrateProjects(data.projects || [])

  if (data.site) {
    console.log('迁移站点信息...')
    const sitePayload = { ...data.site }
    delete sitePayload._id
    delete sitePayload.body
    await upsertSingle('site', sitePayload)
  }

  if (data.about) {
    console.log('迁移关于我...')
    const aboutPayload = { ...data.about }
    delete aboutPayload._id
    await upsertSingle('about', aboutPayload)
  }

  console.log('迁移完成')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
