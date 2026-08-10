const https = require('https')

function requestToken(code, clientId, clientSecret) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    })

    const req = https.request(
      {
        hostname: 'github.com',
        path: '/login/oauth/access_token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 10000,
      },
      (res) => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(body))
          } catch (e) {
            resolve({ error: 'invalid_response', error_description: body })
          }
        })
      },
    )

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request to GitHub timed out'))
    })
    req.write(data)
    req.end()
  })
}

function getPath(event) {
  const path = event.path || ''
  // CloudBase HTTP 触发器路径可能包含函数名前缀 /github-oauth
  return path.replace(/^\/github-oauth/, '')
}

exports.main = async (event, context) => {
  console.log('event:', JSON.stringify(event))

  const { httpMethod, queryStringParameters, headers } = event
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' }
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET' }),
    }
  }

  const protocol = headers['x-forwarded-proto'] || 'https'
  const host = headers.host
  const baseUrl = `${protocol}://${host}/github-oauth`
  const path = getPath(event)

  // 1) 重定向到 GitHub 授权页
  if (path === '/auth' || path === '/auth/') {
    const redirectUri = `${baseUrl}/callback`
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo`
    return {
      statusCode: 302,
      headers: { Location: githubUrl },
      body: '',
    }
  }

  // 2) GitHub 回调：换取 token 并返回给 Decap CMS
  if (path === '/callback' || path === '/callback/') {
    const code = queryStringParameters && queryStringParameters.code

    if (!code) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing code parameter' }),
      }
    }

    let tokenRes
    try {
      tokenRes = await requestToken(code, clientId, clientSecret)
    } catch (err) {
      console.error('requestToken error:', err.message)
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'github_request_failed', message: err.message }),
      }
    }

    if (tokenRes.error) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify(tokenRes),
      }
    }

    const token = tokenRes.access_token
    if (!token) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'no_access_token', response: tokenRes }),
      }
    }

    const message = JSON.stringify({ provider: 'github', token }).replace(/'/g, "\\'")

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>授权成功</title>
</head>
<body>
  <script>
    (function() {
      function receiveMessage(e) {
        if (!e.origin || !/^https?:\/\//.test(e.origin)) return;
        window.opener.postMessage(
          'authorization:github:success:${message}',
          e.origin
        );
      }
      window.addEventListener("message", receiveMessage, false);
      window.opener && window.opener.postMessage("authorizer:github:oauth:success", "*");
    })();
  </script>
</body>
</html>`

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html', ...corsHeaders },
      body: html,
    }
  }

  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Not found', path }),
  }
}
