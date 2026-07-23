import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const distDirectory = join(projectRoot, 'dist')
const siteUrl = 'https://luxferre.cc'
const errors = []

function fail(message) {
  errors.push(message)
}

function walkHtml(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    return statSync(path).isDirectory()
      ? walkHtml(path)
      : path.endsWith('.html')
        ? [path]
        : []
  })
}

function matchContent(html, pattern) {
  return html.match(pattern)?.[1]?.trim()
}

function metaContent(html, key, value) {
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return matchContent(
    html,
    new RegExp(
      `<meta\\s+${key}=["']${escapedValue}["']\\s+content=["']([^"']+)["']\\s*\\/?\\s*>`,
      'i',
    ),
  )
}

function canonicalHref(html) {
  return matchContent(
    html,
    /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']\s*\/?\s*>/i,
  )
}

function validateXml(xml) {
  const stack = []
  const withoutDeclarations = xml
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  for (const match of withoutDeclarations.matchAll(/<([^>]+)>/g)) {
    const token = match[1].trim()
    if (!token || token.startsWith('!') || token.endsWith('/')) {
      continue
    }
    if (token.startsWith('/')) {
      const closing = token.slice(1).trim()
      const opening = stack.pop()
      if (opening !== closing) {
        return false
      }
      continue
    }
    stack.push(token.split(/\s+/)[0])
  }

  return stack.length === 0
}

function outputPathForUrl(urlValue) {
  const url = new URL(urlValue, `${siteUrl}/`)
  const decodedPath = decodeURIComponent(url.pathname)
  const relativePath = decodedPath.replace(/^\/+/, '')
  if (!relativePath) {
    return join(distDirectory, 'index.html')
  }
  if (decodedPath.endsWith('/')) {
    return join(distDirectory, relativePath, 'index.html')
  }
  return join(distDirectory, relativePath)
}

if (!existsSync(distDirectory)) {
  throw new Error('dist was not found. Run npm run build first.')
}

const htmlFiles = walkHtml(distDirectory)
const indexableCanonicals = []
const titles = new Map()

for (const htmlPath of htmlFiles) {
  const route = relative(distDirectory, htmlPath).replaceAll('\\', '/')
  const html = readFileSync(htmlPath, 'utf8')
  const title = matchContent(html, /<title>([\s\S]*?)<\/title>/i)
  const description = metaContent(html, 'name', 'description')
  const robots = metaContent(html, 'name', 'robots')
  const canonical = canonicalHref(html)
  const h1Count = (html.match(/<h1\b/gi) ?? []).length
  const ogImage = metaContent(html, 'property', 'og:image')

  if (!title || !title.includes('정민기')) {
    fail(`${route}: title must include 정민기`)
  }
  if (!description) {
    fail(`${route}: missing meta description`)
  }
  if (!robots) {
    fail(`${route}: missing robots meta`)
  }
  if (!canonical?.startsWith(`${siteUrl}/`)) {
    fail(`${route}: canonical must use ${siteUrl}`)
  }
  if (h1Count !== 1) {
    fail(`${route}: expected exactly one static H1, found ${h1Count}`)
  }
  if (ogImage !== `${siteUrl}/og-image-seo.png`) {
    fail(`${route}: incorrect absolute OG image URL`)
  }
  if (!metaContent(html, 'name', 'twitter:card')) {
    fail(`${route}: missing Twitter Card metadata`)
  }

  if (route === '404.html') {
    if (!robots.includes('noindex')) {
      fail('404.html: expected noindex')
    }
    if (!html.includes('href="/"')) {
      fail('404.html: missing home link')
    }
    if (/<script\s+type="module"/i.test(html)) {
      fail('404.html: must not boot the SPA and replace the 404 content')
    }
  } else {
    if (robots.includes('noindex')) {
      fail(`${route}: indexable page contains noindex`)
    }
    if (canonical) {
      indexableCanonicals.push(canonical)
    }
    const priorRoute = titles.get(title)
    if (priorRoute) {
      fail(`${route}: duplicate title also used by ${priorRoute}`)
    }
    titles.set(title, route)

    const jsonLdText = matchContent(
      html,
      /<script\s+id="portfolio-json-ld"\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i,
    )
    if (!jsonLdText) {
      fail(`${route}: missing JSON-LD`)
    } else {
      try {
        JSON.parse(jsonLdText)
      } catch (error) {
        fail(`${route}: invalid JSON-LD (${error.message})`)
      }
    }
  }

  for (const hrefMatch of html.matchAll(/href=["']([^"']+)["']/gi)) {
    const href = hrefMatch[1]
    if (
      href.startsWith('http:') ||
      href.startsWith('https:') ||
      href.startsWith('mailto:') ||
      href.startsWith('#')
    ) {
      continue
    }
    const target = href.split('#')[0].split('?')[0]
    if (!target) {
      continue
    }
    const outputPath = outputPathForUrl(target)
    if (!existsSync(outputPath)) {
      fail(`${route}: broken internal link ${href}`)
    }
  }
}

const homeHtml = readFileSync(join(distDirectory, 'index.html'), 'utf8')
if (!homeHtml.includes('대전대학교 AISW학부')) {
  fail('index.html: affiliation is absent from initial HTML')
}
if (!homeHtml.includes('정보보안') || !homeHtml.includes('취약점 분석')) {
  fail('index.html: core expertise is absent from initial HTML')
}

const homeJsonLdText = matchContent(
  homeHtml,
  /<script\s+id="portfolio-json-ld"\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i,
)
if (homeJsonLdText) {
  const homeJsonLd = JSON.parse(homeJsonLdText)
  const people = homeJsonLd['@graph']?.filter((entry) => entry['@type'] === 'Person') ?? []
  if (people.length !== 1 || people[0].name !== '정민기') {
    fail('index.html: expected exactly one Person named 정민기')
  }
  if (!people[0]?.affiliation?.name?.includes('대전대학교')) {
    fail('index.html: Person affiliation must include 대전대학교')
  }
  if (people[0]?.sameAs?.some((url) => url.includes('newsis.com'))) {
    fail('index.html: news coverage must be subjectOf, not sameAs')
  }
  if (!people[0]?.subjectOf?.some((entry) => entry.url?.includes('newsis.com'))) {
    fail('index.html: verified award coverage is missing from subjectOf')
  }
}

const robots = readFileSync(join(distDirectory, 'robots.txt'), 'utf8')
if (/Disallow:\s*\//i.test(robots)) {
  fail('robots.txt blocks the site')
}
if (!robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) {
  fail('robots.txt points to the wrong sitemap')
}

const sitemap = readFileSync(join(distDirectory, 'sitemap.xml'), 'utf8')
if (!validateXml(sitemap)) {
  fail('sitemap.xml is not well formed')
}
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => match[1],
)
for (const canonical of indexableCanonicals) {
  if (!sitemapUrls.includes(canonical)) {
    fail(`sitemap.xml is missing canonical ${canonical}`)
  }
}
for (const sitemapUrl of sitemapUrls) {
  if (!sitemapUrl.startsWith(`${siteUrl}/`)) {
    fail(`sitemap.xml contains a foreign origin: ${sitemapUrl}`)
  }
  if (!existsSync(outputPathForUrl(sitemapUrl))) {
    fail(`sitemap.xml contains a missing route: ${sitemapUrl}`)
  }
}

const ogImage = readFileSync(join(distDirectory, 'og-image-seo.png'))
if (ogImage.toString('ascii', 1, 4) !== 'PNG') {
  fail('og-image-seo.png is not a PNG file')
} else {
  const width = ogImage.readUInt32BE(16)
  const height = ogImage.readUInt32BE(20)
  if (width !== 1200 || height !== 630) {
    fail(`og-image-seo.png must be 1200x630, found ${width}x${height}`)
  }
}

const forbiddenPlaceholders = [
  '<SITE_URL>',
  'example.com',
  'Coming soon',
  'Replace this starter',
]
for (const htmlPath of htmlFiles) {
  const html = readFileSync(htmlPath, 'utf8')
  for (const placeholder of forbiddenPlaceholders) {
    if (html.includes(placeholder)) {
      fail(`${relative(distDirectory, htmlPath)}: placeholder remains: ${placeholder}`)
    }
  }
}

if (errors.length > 0) {
  console.error(`SEO validation failed with ${errors.length} issue(s):`)
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log(
  `SEO validation passed: ${indexableCanonicals.length} indexable pages, ${htmlFiles.length} HTML files, valid JSON-LD, sitemap, robots, OG image, and internal links.`,
)
