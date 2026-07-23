import {
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDirectory = join(projectRoot, 'dist')
const publicDirectory = join(projectRoot, 'public')
const writeupsDirectory = join(projectRoot, 'src', 'writeups')
const portfolio = JSON.parse(
  readFileSync(join(projectRoot, 'src', 'data', 'portfolio.json'), 'utf8'),
)
const { activities, contactLinks, externalProfiles, interests, profile, projects } =
  portfolio

const HOME_DESCRIPTION = profile.description
const WRITEUPS_DESCRIPTION =
  '정민기의 CTF 풀이, 취약점 분석, 디지털 포렌식, AI 보안 및 소프트웨어 개발 기록입니다.'
const ROBOTS_CONTENT =
  'User-agent: *\nAllow: /\n\nSitemap: https://luxferre.cc/sitemap.xml\n'
const HEAD_START = '<!-- seo-head:start -->'
const HEAD_END = '<!-- seo-head:end -->'
const STATIC_START = '<!-- seo-static:start -->'
const STATIC_END = '<!-- seo-static:end -->'

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeXml(value) {
  return escapeHtml(value)
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}

function stripWrappingQuotes(value) {
  return value.replace(/^["']|["']$/g, '')
}

function parseFrontmatterValue(value) {
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => stripWrappingQuotes(item.trim()))
      .filter(Boolean)
  }

  return stripWrappingQuotes(value.trim())
}

function parseWriteup(fileName) {
  const raw = readFileSync(join(writeupsDirectory, fileName), 'utf8').replaceAll(
    '\r\n',
    '\n',
  )
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)

  if (!match) {
    throw new Error(`Invalid frontmatter in ${fileName}`)
  }

  const metadata = Object.fromEntries(
    match[1]
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(':')
        if (separator === -1) {
          throw new Error(`Invalid frontmatter line in ${fileName}: ${line}`)
        }
        const key = line.slice(0, separator).trim()
        const value = line.slice(separator + 1).trim()
        return [key, parseFrontmatterValue(value)]
      }),
  )
  const slug = fileName.slice(0, -extname(fileName).length)

  if (!metadata.title || !metadata.date || !metadata.summary) {
    throw new Error(`title, date, and summary are required in ${fileName}`)
  }
  if (slug.includes('..') || /[\\/]/.test(slug)) {
    throw new Error(`Unsafe writeup slug: ${slug}`)
  }

  return {
    slug,
    title: String(metadata.title),
    date: String(metadata.date),
    category: String(metadata.category ?? 'Misc'),
    tags: Array.isArray(metadata.tags) ? metadata.tags : [],
    difficulty: String(metadata.difficulty ?? 'Practice'),
    readTime: String(metadata.readTime ?? ''),
    summary: String(metadata.summary),
    content: match[2].trim(),
  }
}

const writeups = readdirSync(writeupsDirectory)
  .filter((fileName) => extname(fileName).toLowerCase() === '.md')
  .map(parseWriteup)
  .sort((left, right) => right.date.localeCompare(left.date))

function writeupPath(slug) {
  return `/writeups/${encodeURIComponent(slug)}/`
}

function routeMetadata(route) {
  if (route.kind === 'home') {
    return {
      canonical: `${profile.siteUrl}/`,
      description: HOME_DESCRIPTION,
      ogDescription: profile.shortDescription,
      ogType: 'profile',
      robots: 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
      title: `${profile.name} | ${profile.title}`,
    }
  }

  if (route.kind === 'writeups') {
    return {
      canonical: `${profile.siteUrl}/writeups/`,
      description: WRITEUPS_DESCRIPTION,
      ogDescription: WRITEUPS_DESCRIPTION,
      ogType: 'website',
      robots: 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
      title: '정민기 정보보안 글 | CTF·취약점 분석·개발 기록',
    }
  }

  if (route.kind === 'article') {
    return {
      canonical: `${profile.siteUrl}${writeupPath(route.writeup.slug)}`,
      description: route.writeup.summary,
      ogDescription: route.writeup.summary,
      ogType: 'article',
      robots: 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
      title: `${route.writeup.title} | 정민기 정보보안 포트폴리오`,
    }
  }

  return {
    canonical: `${profile.siteUrl}/404.html`,
    description: '요청한 페이지를 찾을 수 없습니다.',
    ogDescription: '요청한 페이지를 찾을 수 없습니다.',
    ogType: 'website',
    robots: 'noindex,follow',
    title: `페이지를 찾을 수 없습니다 | ${profile.siteName}`,
  }
}

function structuredData(route, metadata) {
  const websiteId = `${profile.siteUrl}/#website`
  const personId = `${profile.siteUrl}/#person`

  if (route.kind === 'home') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': websiteId,
          url: `${profile.siteUrl}/`,
          name: profile.siteName,
          alternateName: '정민기 공식 포트폴리오',
          inLanguage: 'ko-KR',
        },
        {
          '@type': 'ProfilePage',
          '@id': `${profile.siteUrl}/#profilepage`,
          url: `${profile.siteUrl}/`,
          name: metadata.title,
          isPartOf: { '@id': websiteId },
          mainEntity: { '@id': personId },
          inLanguage: 'ko-KR',
        },
        {
          '@type': 'Person',
          '@id': personId,
          name: profile.name,
          alternateName: profile.romanizedName,
          url: `${profile.siteUrl}/`,
          description: profile.description,
          affiliation: {
            '@type': 'CollegeOrUniversity',
            name: profile.university,
            url: profile.schoolUrl,
          },
          knowsAbout: interests,
          sameAs: [profile.github],
          award: activities.map((activity) => activity.name),
          subjectOf: activities.flatMap((activity) =>
            activity.articleTitle && activity.evidenceUrl
              ? [
                  {
                    '@type': 'NewsArticle',
                    name: activity.articleTitle,
                    url: activity.evidenceUrl,
                  },
                ]
              : [],
          ),
        },
      ],
    }
  }

  if (route.kind === 'writeups') {
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${metadata.canonical}#collection`,
      url: metadata.canonical,
      name: metadata.title,
      description: metadata.description,
      isPartOf: { '@id': websiteId },
      author: { '@id': personId },
      inLanguage: 'ko-KR',
    }
  }

  if (route.kind === 'article') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `${metadata.canonical}#article`,
      url: metadata.canonical,
      headline: route.writeup.title,
      description: route.writeup.summary,
      datePublished: route.writeup.date,
      inLanguage: 'ko-KR',
      keywords: route.writeup.tags,
      author: { '@id': personId },
      isPartOf: { '@id': websiteId },
      mainEntityOfPage: metadata.canonical,
    }
  }

  return null
}

function renderHead(route) {
  const metadata = routeMetadata(route)
  const jsonLd = structuredData(route, metadata)
  const articleDate =
    route.kind === 'article'
      ? `\n    <meta property="article:published_time" content="${escapeHtml(route.writeup.date)}" />`
      : ''
  const profileMeta =
    route.kind === 'home'
      ? '\n    <meta property="profile:first_name" content="민기" />\n    <meta property="profile:last_name" content="정" />'
      : ''
  const jsonLdTag = jsonLd
    ? `\n    <script id="portfolio-json-ld" type="application/ld+json">${escapeJsonForHtml(jsonLd)}</script>`
    : ''

  return `${HEAD_START}
    <title>${escapeHtml(metadata.title)}</title>
    <meta name="description" content="${escapeHtml(metadata.description)}" />
    <meta name="author" content="${escapeHtml(profile.name)}" />
    <meta name="robots" content="${metadata.robots}" />
    <link rel="canonical" href="${metadata.canonical}" />
    <meta property="og:type" content="${metadata.ogType}" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:site_name" content="${escapeHtml(profile.siteName)}" />
    <meta property="og:title" content="${escapeHtml(metadata.title)}" />
    <meta property="og:description" content="${escapeHtml(metadata.ogDescription)}" />
    <meta property="og:url" content="${metadata.canonical}" />
    <meta property="og:image" content="${profile.siteUrl}${profile.ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="정민기 대전대학교 AISW학부 Security AI CTF 포트폴리오" />${profileMeta}${articleDate}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(metadata.title)}" />
    <meta name="twitter:description" content="${escapeHtml(metadata.ogDescription)}" />
    <meta name="twitter:image" content="${profile.siteUrl}${profile.ogImage}" />
    <meta name="twitter:image:alt" content="정민기 대전대학교 AISW학부 Security AI CTF 포트폴리오" />${jsonLdTag}
    ${HEAD_END}`
}

function renderStaticHeader() {
  return `<header class="border-b border-white/10 bg-[#050711]">
      <nav aria-label="주요 메뉴" class="section-shell flex flex-wrap items-center gap-5 py-5">
        <a class="font-semibold text-white" href="/">정민기 포트폴리오</a>
        <a href="/#about">소개</a>
        <a href="/#projects">프로젝트</a>
        <a href="/#activities">수상 및 활동</a>
        <a href="/writeups/">연구 및 기술 기록</a>
        <a href="/#contact">연락</a>
      </nav>
    </header>`
}

function renderStaticFooter() {
  return `<footer class="border-t border-white/10 px-4 py-8 text-sm text-slate-500">
      <p class="section-shell">© 2026 ${escapeHtml(profile.name)}. 정민기 공식 포트폴리오.</p>
    </footer>`
}

function renderHome() {
  const projectCards = projects
    .filter((project) => project.featured)
    .map(
      (project) => `<article class="project-card">
          <p class="text-sm text-cyan-200">${escapeHtml(project.eyebrow)}</p>
          <h3 class="mt-2 text-2xl font-semibold text-white">${escapeHtml(project.name)}</h3>
          <p class="mt-5 leading-7 text-slate-300">${escapeHtml(project.description)}</p>
          <p class="mt-5 text-sm text-slate-400">${project.stack.map(escapeHtml).join(' · ')}</p>
        </article>`,
    )
    .join('\n')
  const activityCards = activities
    .map(
      (activity) => `<article class="project-card">
          <p class="text-sm text-cyan-200">${
            activity.date && activity.displayDate
              ? `<time datetime="${activity.date}">${escapeHtml(activity.displayDate)}</time>`
              : '수상 기록'
          }${activity.team ? ` · ${escapeHtml(activity.team)}` : ''}</p>
          <h3 class="mt-2 text-2xl font-semibold text-white">${escapeHtml(activity.name)}</h3>
          <p class="mt-5 leading-7 text-slate-300">${escapeHtml(activity.description)}</p>
          ${
            activity.evidenceUrl && activity.evidenceLabel
              ? `<a class="mt-5 inline-block text-cyan-200" href="${activity.evidenceUrl}" rel="noopener noreferrer">${escapeHtml(activity.evidenceLabel)}</a>`
              : ''
          }
        </article>`,
    )
    .join('\n')
  const writeupLinks = writeups
    .slice(0, 6)
    .map(
      (writeup) => `<li><a href="${writeupPath(writeup.slug)}">${escapeHtml(writeup.title)}</a> — ${escapeHtml(writeup.summary)}</li>`,
    )
    .join('\n')
  const externalLinks = externalProfiles
    .map(
      (externalProfile) => `<li><a href="${externalProfile.href}" rel="noopener noreferrer">${escapeHtml(externalProfile.label)}</a></li>`,
    )
    .join('\n')
  const contactItems = contactLinks
    .map(
      (contact) => `<li><a href="${contact.href}">${escapeHtml(contact.label)}: ${escapeHtml(contact.value)}</a></li>`,
    )
    .join('\n')

  return `${STATIC_START}
    ${renderStaticHeader()}
    <main>
      <section class="section-shell pt-32 pb-24">
        <p class="text-cyan-200">정민기 공식 포트폴리오</p>
        <h1 class="mt-4 text-5xl font-semibold text-white">${escapeHtml(profile.name)} <span class="text-slate-300">(${escapeHtml(profile.romanizedName)})</span></h1>
        <p class="mt-4 text-xl text-cyan-100">${escapeHtml(profile.affiliation)}</p>
        <p class="mt-6 max-w-3xl leading-8 text-slate-300">정민기는 대전대학교 AISW학부에서 정보보안과 취약점 분석을 중심으로 CTF, 인공지능 및 소프트웨어 프로젝트를 수행하고 있습니다. 이 사이트는 프로젝트, 수상, 연구 및 학습 기록을 정리한 공식 포트폴리오입니다.</p>
      </section>
      <section id="about" class="section-shell py-20">
        <h2 class="text-3xl font-semibold text-white">전문 분야</h2>
        <p class="mt-5 text-slate-300">${interests.map(escapeHtml).join(' · ')}</p>
      </section>
      <section id="projects" class="section-shell py-20">
        <h2 class="text-3xl font-semibold text-white">정민기 대표 프로젝트</h2>
        <div class="mt-10 grid gap-5 md:grid-cols-2">${projectCards}</div>
      </section>
      <section id="activities" class="section-shell py-20">
        <h2 class="text-3xl font-semibold text-white">수상 및 활동</h2>
        <div class="mt-10">${activityCards}</div>
      </section>
      <section class="section-shell py-20">
        <h2 class="text-3xl font-semibold text-white">연구 및 학습 기록</h2>
        <ul class="mt-6 space-y-4">${writeupLinks}</ul>
        <a class="mt-8 inline-block text-cyan-200" href="/writeups/">전체 기술 기록 보기</a>
      </section>
      <section id="contact" class="section-shell py-20">
        <h2 class="text-3xl font-semibold text-white">외부 공식 프로필과 공개 연락 수단</h2>
        <ul class="mt-6 space-y-3">${externalLinks}${contactItems}</ul>
      </section>
    </main>
    ${renderStaticFooter()}
    ${STATIC_END}`
}

function renderWriteupList() {
  const cards = writeups
    .map(
      (writeup) => `<article class="writeup-card">
          <p class="text-sm text-cyan-200">${escapeHtml(writeup.category)} · <time datetime="${writeup.date}">${escapeHtml(writeup.date)}</time></p>
          <h2 class="mt-2 text-xl font-semibold text-white"><a href="${writeupPath(writeup.slug)}">${escapeHtml(writeup.title)}</a></h2>
          <p class="mt-3 leading-7 text-slate-300">${escapeHtml(writeup.summary)}</p>
        </article>`,
    )
    .join('\n')

  return `${STATIC_START}
    ${renderStaticHeader()}
    <main class="section-shell pt-32 pb-24">
      <h1 class="text-4xl font-semibold text-white">정민기 정보보안 글과 CTF·취약점 분석 기록</h1>
      <p class="mt-5 max-w-3xl leading-8 text-slate-300">${WRITEUPS_DESCRIPTION}</p>
      <section aria-label="기술 기록 목록" class="mt-10 grid gap-4">${cards}</section>
    </main>
    ${renderStaticFooter()}
    ${STATIC_END}`
}

function renderInlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

function renderMarkdown(markdown) {
  const lines = markdown.split('\n')
  const output = []
  let paragraph = []
  let inList = false
  let inCode = false
  let codeLines = []

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      output.push(`<p>${renderInlineMarkdown(paragraph.join(' '))}</p>`)
      paragraph = []
    }
  }
  const closeList = () => {
    if (inList) {
      output.push('</ul>')
      inList = false
    }
  }

  for (const line of lines) {
    if (line.startsWith('```')) {
      flushParagraph()
      closeList()
      if (inCode) {
        output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
        codeLines = []
      }
      inCode = !inCode
      continue
    }
    if (inCode) {
      codeLines.push(line)
      continue
    }
    if (/^###\s+/.test(line)) {
      flushParagraph()
      closeList()
      output.push(`<h3>${renderInlineMarkdown(line.replace(/^###\s+/, ''))}</h3>`)
      continue
    }
    if (/^##\s+/.test(line)) {
      flushParagraph()
      closeList()
      output.push(`<h2>${renderInlineMarkdown(line.replace(/^##\s+/, ''))}</h2>`)
      continue
    }
    if (/^-\s+/.test(line)) {
      flushParagraph()
      if (!inList) {
        output.push('<ul>')
        inList = true
      }
      output.push(`<li>${renderInlineMarkdown(line.replace(/^-\s+/, ''))}</li>`)
      continue
    }
    if (!line.trim()) {
      flushParagraph()
      closeList()
      continue
    }
    paragraph.push(line.trim())
  }

  flushParagraph()
  closeList()
  if (inCode) {
    output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
  }
  return output.join('\n')
}

function renderArticle(writeup) {
  return `${STATIC_START}
    ${renderStaticHeader()}
    <main class="section-shell pt-32 pb-24">
      <article>
        <p class="text-sm text-cyan-200">${escapeHtml(writeup.category)} · <time datetime="${writeup.date}">${escapeHtml(writeup.date)}</time> · ${escapeHtml(writeup.readTime)}</p>
        <h1 class="mt-5 text-4xl font-semibold text-white">${escapeHtml(writeup.title)}</h1>
        <p class="mt-5 max-w-3xl leading-8 text-slate-300">${escapeHtml(writeup.summary)}</p>
        <p class="mt-4 text-sm text-slate-400">${writeup.tags.map((tag) => `#${escapeHtml(tag)}`).join(' ')}</p>
        <div class="markdown-body mt-10">${renderMarkdown(writeup.content)}</div>
      </article>
      <a class="mt-10 inline-block text-cyan-200" href="/writeups/">정민기 연구 및 기술 기록으로 돌아가기</a>
    </main>
    ${renderStaticFooter()}
    ${STATIC_END}`
}

function renderNotFound() {
  return `${STATIC_START}
    ${renderStaticHeader()}
    <main class="section-shell pt-32 pb-24">
      <p class="text-cyan-200">404</p>
      <h1 class="mt-4 text-4xl font-semibold text-white">페이지를 찾을 수 없습니다</h1>
      <p class="mt-5 text-slate-300">주소가 변경되었거나 존재하지 않는 페이지입니다.</p>
      <a class="primary-btn mt-8" href="/">정민기 포트폴리오 홈으로 이동</a>
    </main>
    ${renderStaticFooter()}
    ${STATIC_END}`
}

function replaceMarkedContent(document, start, end, replacement) {
  const startIndex = document.indexOf(start)
  const endIndex = document.indexOf(end)
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Missing document markers: ${start} / ${end}`)
  }
  return `${document.slice(0, startIndex)}${replacement}${document.slice(endIndex + end.length)}`
}

function renderDocument(template, route) {
  const staticContent =
    route.kind === 'home'
      ? renderHome()
      : route.kind === 'writeups'
        ? renderWriteupList()
        : route.kind === 'article'
          ? renderArticle(route.writeup)
          : renderNotFound()
  let document = replaceMarkedContent(
    template,
    HEAD_START,
    HEAD_END,
    renderHead(route),
  )
  document = replaceMarkedContent(
    document,
    STATIC_START,
    STATIC_END,
    staticContent,
  )
  return document
}

function writeDocument(relativePath, content) {
  const outputPath = join(distDirectory, relativePath)
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, content, 'utf8')
}

function renderSitemap() {
  const urls = [
    `${profile.siteUrl}/`,
    `${profile.siteUrl}/writeups/`,
    ...writeups.map(
      (writeup) => `${profile.siteUrl}${writeupPath(writeup.slug)}`,
    ),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`)
    .join('\n')}\n</urlset>\n`
}

const template = readFileSync(join(distDirectory, 'index.html'), 'utf8')
writeDocument('index.html', renderDocument(template, { kind: 'home' }))
writeDocument(
  join('writeups', 'index.html'),
  renderDocument(template, { kind: 'writeups' }),
)

for (const writeup of writeups) {
  writeDocument(
    join('writeups', writeup.slug, 'index.html'),
    renderDocument(template, { kind: 'article', writeup }),
  )
}

const notFoundDocument = renderDocument(template, { kind: 'not-found' }).replace(
  /\s*<script type="module"[^>]*><\/script>/g,
  '',
)
writeDocument('404.html', notFoundDocument)

const sitemap = renderSitemap()
writeDocument('sitemap.xml', sitemap)
writeDocument('robots.txt', ROBOTS_CONTENT)
writeFileSync(join(publicDirectory, 'sitemap.xml'), sitemap, 'utf8')
writeFileSync(join(publicDirectory, 'robots.txt'), ROBOTS_CONTENT, 'utf8')

console.log(
  `Generated static SEO output for ${writeups.length + 2} indexable routes, sitemap.xml, robots.txt, and 404.html.`,
)
