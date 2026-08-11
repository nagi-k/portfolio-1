import CloudBase from '@cloudbase/manager-node'

const secretId = process.env.CLOUDBASE_SECRET_ID || process.env.TCB_SECRET_ID
const secretKey = process.env.CLOUDBASE_SECRET_KEY || process.env.TCB_SECRET_KEY
const envId = process.env.CLOUDBASE_ENV_ID || process.env.TCB_ENV_ID

if (!envId || !secretId || !secretKey) {
  console.error('请设置环境变量：CLOUDBASE_SECRET_ID / CLOUDBASE_SECRET_KEY / CLOUDBASE_ENV_ID')
  process.exit(1)
}

const required = ['ADMIN_PASSWORD', 'JWT_SECRET', 'GH_TOKEN', 'GH_REPO']
const missing = required.filter((k) => !process.env[k])
if (missing.length) {
  console.error(`缺少环境变量：${missing.join(', ')}`)
  process.exit(1)
}

const app = CloudBase.init({
  secretId,
  secretKey,
  envId,
  region: 'ap-shanghai',
})

await app.functions.updateFunctionConfig({
  name: 'admin-api',
  envVariables: {
    TCB_ENV_ID: envId,
    TCB_SECRET_ID: secretId,
    TCB_SECRET_KEY: secretKey,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    JWT_SECRET: process.env.JWT_SECRET,
    GH_TOKEN: process.env.GH_TOKEN,
    GH_REPO: process.env.GH_REPO,
    GH_WORKFLOW_ID: process.env.GH_WORKFLOW_ID || 'deploy-cloudbase.yml',
    GH_REF: process.env.GH_REF || 'main',
  },
})

console.log('admin-api 云函数环境变量已更新')
