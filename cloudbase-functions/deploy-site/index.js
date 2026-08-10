const https = require('https')

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body })
      })
    })
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('GitHub API request timed out'))
    })
    if (postData) req.write(postData)
    req.end()
  })
}

exports.main = async (event, context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-deploy-secret',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' }
  }

  // 可选：通过环境变量设置部署密钥，管理后台调用时携带，防止被滥用
  const deploySecret = process.env.DEPLOY_SECRET
  let bodyData = {}
  if (event.data) {
    // 直接通过 JS SDK callFunction 调用
    bodyData = event.data
  } else if (event.body) {
    // HTTP 触发器调用
    try {
      bodyData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body
    } catch (e) {
      bodyData = {}
    }
  }
  const providedSecret =
    (event.headers && (event.headers['x-deploy-secret'] || event.headers['X-Deploy-Secret'])) ||
    bodyData.secret
  if (deploySecret && deploySecret !== providedSecret) {
    return {
      statusCode: 403,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Forbidden: invalid deploy secret' }),
    }
  }

  const ghToken = process.env.GH_TOKEN
  const ghRepo = process.env.GH_REPO
  const workflowId = process.env.GH_WORKFLOW_ID || 'deploy-cloudbase.yml'
  const ref = process.env.GH_REF || 'main'

  if (!ghToken || !ghRepo) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing GH_TOKEN or GH_REPO env vars' }),
    }
  }

  const [owner, repo] = ghRepo.split('/')
  if (!owner || !repo) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'GH_REPO must be in format owner/repo' }),
    }
  }

  const path = `/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(workflowId)}/dispatches`
  const postData = JSON.stringify({ ref })

  try {
    const result = await request(
      {
        hostname: 'api.github.com',
        path,
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${ghToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'cloudbase-deploy-site',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 15000,
      },
      postData,
    )

    if (result.statusCode === 204) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ ok: true, message: 'Deploy triggered' }),
      }
    }

    return {
      statusCode: result.statusCode,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'GitHub API returned non-204 status',
        statusCode: result.statusCode,
        body: result.body,
      }),
    }
  } catch (err) {
    console.error('Trigger deploy error:', err.message)
    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to trigger deploy', message: err.message }),
    }
  }
}
