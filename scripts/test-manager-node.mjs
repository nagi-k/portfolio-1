import cloudbase from '@cloudbase/manager-node'

const secretId = process.env.CLOUDBASE_SECRET_ID
const secretKey = process.env.CLOUDBASE_SECRET_KEY
const envId = process.env.CLOUDBASE_ENV_ID
const region = process.env.CLOUDBASE_REGION || 'ap-shanghai'

console.log('Testing manager-node with env:', envId, 'region:', region)

const app = cloudbase.init({
  secretId,
  secretKey,
  envId,
  region,
})

async function main() {
  try {
    const env = app.currentEnvironment()
    console.log('Lazy init environment...')
    await env.lazyInit()
    console.log('Env config:', JSON.stringify(env.lazyEnvironmentConfig, null, 2))
    console.log('Databases:', JSON.stringify(env.lazyEnvironmentConfig.Databases, null, 2))

    console.log('Listing collections...')
    const res = await app.database.listCollections()
    console.log('Collections:', JSON.stringify(res, null, 2))
  } catch (err) {
    console.error('Error:', err.message)
    console.error('Stack:', err.stack)
    if (err.response) {
      console.error('Response:', JSON.stringify(err.response, null, 2))
    }
  }
}

main()
