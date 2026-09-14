interface Env {
  GITHUB_OAUTH_ID: string
  GITHUB_OAUTH_SECRET: string
  GITHUB_REPO_PRIVATE?: string
}

const STATE_COOKIE = 'luxferre_oauth_state'
const CALLBACK_PATH = '/callback'
const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const CMS_ORIGIN = 'https://luxferre.cc'

function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('Cookie') ?? ''

  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=')
    if (separator === -1) continue

    const key = cookie.slice(0, separator).trim()
    if (key === name) {
      return decodeURIComponent(cookie.slice(separator + 1).trim())
    }
  }

  return null
}

function cookieHeader(value: string, maxAge: number): string {
  return `${STATE_COOKIE}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`
}

function securityHeaders(contentType: string): Headers {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Content-Type': contentType,
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  })

  return headers
}

function errorResponse(message: string, status = 400): Response {
  return new Response(message, {
    headers: securityHeaders('text/plain; charset=utf-8'),
    status,
  })
}

function callbackPage(status: 'success' | 'error', payload: unknown): Response {
  const serializedPayload = JSON.stringify(payload).replaceAll('<', '\\u003c')
  const body = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Decap authorization</title></head>
  <body>
    <p>Returning to Decap CMS…</p>
    <script>
      const message = 'authorization:github:${status}:' + ${JSON.stringify(serializedPayload)};
      if (window.opener) {
        window.opener.postMessage(message, ${JSON.stringify(CMS_ORIGIN)});
      }
      window.close();
    </script>
  </body>
</html>`

  return new Response(body, {
    headers: securityHeaders('text/html; charset=utf-8'),
  })
}

function callbackUrl(url: URL): string {
  return `${url.origin}${CALLBACK_PATH}`
}

async function startAuth(url: URL, env: Env): Promise<Response> {
  if (url.searchParams.get('provider') !== 'github') {
    return errorResponse('Invalid provider')
  }

  const clientId = env.GITHUB_OAUTH_ID?.trim()
  const clientSecret = env.GITHUB_OAUTH_SECRET?.trim()

  if (!clientId || !clientSecret) {
    return errorResponse('OAuth provider is not configured', 500)
  }

  const state = randomToken()
  const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL)
  authorizeUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl(url),
    scope:
      env.GITHUB_REPO_PRIVATE === '1' ? 'repo,user' : 'public_repo,user',
    state,
  }).toString()

  const headers = securityHeaders('text/plain; charset=utf-8')
  headers.set('Location', authorizeUrl.toString())
  headers.set('Set-Cookie', cookieHeader(state, 600))
  return new Response(null, { headers, status: 302 })
}

async function exchangeCode(
  url: URL,
  code: string,
  env: Env,
): Promise<string> {
  const clientId = env.GITHUB_OAUTH_ID?.trim()
  const clientSecret = env.GITHUB_OAUTH_SECRET?.trim()

  if (!clientId || !clientSecret) {
    throw new Error('OAuth provider is not configured')
  }

  const response = await fetch(GITHUB_TOKEN_URL, {
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl(url),
    }),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'luxferre-decap-auth',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed: ${response.status}`)
  }

  const result = (await response.json()) as {
    access_token?: string
    error?: string
  }

  if (!result.access_token) {
    throw new Error(result.error ?? 'GitHub did not return an access token')
  }

  return result.access_token
}

async function finishAuth(request: Request, url: URL, env: Env): Promise<Response> {
  const providerError = url.searchParams.get('error')
  if (providerError) {
    return callbackPage('error', { error: providerError })
  }

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const savedState = getCookie(request, STATE_COOKIE)

  if (!code || !state || !savedState || state !== savedState) {
    return errorResponse('Invalid OAuth state or missing authorization code')
  }

  try {
    const token = await exchangeCode(url, code, env)
    const response = callbackPage('success', { token })
    response.headers.append('Set-Cookie', cookieHeader('', 0))
    return response
  } catch (error) {
    console.error(error)
    return callbackPage('error', {
      error: 'GitHub authorization could not be completed',
    })
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method !== 'GET') {
      return errorResponse('Method not allowed', 405)
    }

    if (url.pathname === '/auth') {
      return startAuth(url, env)
    }

    if (url.pathname === CALLBACK_PATH) {
      return finishAuth(request, url, env)
    }

    return new Response('luxferre.cc Decap OAuth proxy', {
      headers: securityHeaders('text/plain; charset=utf-8'),
    })
  },
}
