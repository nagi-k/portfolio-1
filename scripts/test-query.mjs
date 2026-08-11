import CloudBase from '@cloudbase/manager-node'

const secretId = process.env.CLOUDBASE_SECRET_ID
const secretKey = process.env.CLOUDBASE_SECRET_KEY
const envId = process.env.CLOUDBASE_ENV_ID

const app = CloudBase.init({ secretId, secretKey, envId, region: 'ap-shanghai' })
const pg = app.database

const res = await pg.executePGSql({ Sql: 'SELECT * FROM projects LIMIT 1', Role: 'cloudbase_postgres' })
console.log('Rows:', JSON.stringify(res.Rows, null, 2))
