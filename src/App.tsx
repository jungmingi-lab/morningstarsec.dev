import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  GitBranch,
  Menu,
  Search,
  Terminal,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  activities,
  interests,
  profile,
} from './data/portfolio'
import {
  WRITEUP_CATEGORIES,
  writeups,
  type Writeup,
  type WriteupCategory,
} from './lib/writeups'

type Route = {
  page: 'home' | 'writeups'
  slug?: string
}

type CategoryFilter = '전체' | WriteupCategory

const categoryOptions: CategoryFilter[] = [
  '전체',
  ...WRITEUP_CATEGORIES,
]
const achievementCategories = ['CTF/Wargame', '경력/공모전'] as const
const writeupsDescription =
  '직접 만든 서비스, 분석한 취약점, 읽은 보안 논문과 실습 기록을 모았습니다. 무엇을 시도했고 어디서 막혔으며 어떻게 확인했는지 기록합니다.'

const suggestedWriteups = [
  {
    slug: 'go-png-file-share',
    label: '개발',
    reason: 'PNG 업로드 서버를 만들며 파일 검증, 저장 경로, 공유 링크를 어떻게 처리했는지',
  },
  {
    slug: 'pypdf-cve-2026-102996-mission-report',
    label: '취약점 분석',
    reason: 'pypdf 코드를 살펴본 이유부터 자원 소모 문제의 재현과 수정 확인까지',
  },
  {
    slug: 'domino-effect-paper-review',
    label: '논문 읽기',
    reason: 'DOM Clobbering의 기본 개념과 TheThing·Hulk가 문제에 접근한 방식',
  },
] as const

function readRoute(): Route {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  if (path === '/writeups') {
    return { page: 'writeups' }
  }

  if (path.startsWith('/writeups/')) {
    return {
      page: 'writeups',
      slug: decodeURIComponent(path.replace('/writeups/', '')),
    }
  }

  return { page: 'home' }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'long',
  }).format(new Date(`${value}T00:00:00`))
}

function writeupPath(slug: string) {
  return `/writeups/${encodeURIComponent(slug)}`
}

function canonicalForRoute(route: Route) {
  if (route.page === 'home') {
    return `${profile.siteUrl}/`
  }

  return route.slug
    ? `${profile.siteUrl}${writeupPath(route.slug)}/`
    : `${profile.siteUrl}/writeups/`
}

function setMetaContent(selector: string, content: string) {
  document.head.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', content)
}

function buildStructuredData(route: Route, selectedWriteup?: Writeup) {
  const canonical = canonicalForRoute(route)
  const websiteId = `${profile.siteUrl}/#website`
  const personId = `${profile.siteUrl}/#person`

  if (route.page === 'home') {
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
          name: `정민기 | ${profile.title}`,
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

  if (selectedWriteup && route.slug) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `${canonical}#article`,
      url: canonical,
      headline: selectedWriteup.title,
      description: selectedWriteup.summary,
      datePublished: selectedWriteup.date,
      inLanguage: 'ko-KR',
      keywords: selectedWriteup.tags,
      author: { '@id': personId },
      isPartOf: { '@id': websiteId },
      mainEntityOfPage: canonical,
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${canonical}#collection`,
    url: canonical,
    name: '연구 노트',
    description: writeupsDescription,
    isPartOf: { '@id': websiteId },
    author: { '@id': personId },
    inLanguage: 'ko-KR',
  }
}

function Seo({ route }: { route: Route }) {
  useEffect(() => {
    const selectedWriteup = route.slug
      ? writeups.find((writeup) => writeup.slug === route.slug)
      : undefined
    const title = selectedWriteup
      ? `${selectedWriteup.title} | 정민기 정보보안 포트폴리오`
      : route.page === 'writeups'
        ? '연구 노트 | 정민기'
        : `정민기 | ${profile.title}`
    const description = selectedWriteup
      ? selectedWriteup.summary
      : route.page === 'writeups'
        ? writeupsDescription
        : profile.description
    const canonical = canonicalForRoute(route)

    document.documentElement.lang = 'ko'
    document.title = title
    document.head
      .querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.setAttribute('href', canonical)
    setMetaContent('meta[name="description"]', description)
    setMetaContent('meta[property="og:type"]', selectedWriteup ? 'article' : route.page === 'home' ? 'profile' : 'website')
    setMetaContent('meta[property="og:title"]', title)
    setMetaContent('meta[property="og:description"]', description)
    setMetaContent('meta[property="og:url"]', canonical)
    setMetaContent('meta[name="twitter:title"]', title)
    setMetaContent('meta[name="twitter:description"]', description)

    const jsonLd = document.head.querySelector<HTMLScriptElement>('#portfolio-json-ld')
    if (jsonLd) {
      jsonLd.textContent = JSON.stringify(buildStructuredData(route, selectedWriteup))
    }
  }, [route])

  return null
}

function App() {
  const [route, setRoute] = useState<Route>(() => readRoute())
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handlePopState = () => setRoute(readRoute())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const goHome = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    window.history.pushState({}, '', '/')
    setRoute({ page: 'home' })
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goWriteups = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    window.history.pushState({}, '', '/writeups/')
    setRoute({ page: 'writeups' })
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="site-shell min-h-screen overflow-x-hidden text-slate-100">
      <a className="skip-link" href="#main-content">본문으로 바로가기</a>
      <Seo route={route} />
      {route.page === 'writeups' && <BackgroundFX />}
      <Header
        menuOpen={menuOpen}
        route={route}
        onHome={goHome}
        onMenuToggle={() => setMenuOpen((isOpen) => !isOpen)}
        onWriteups={goWriteups}
      />
      {route.page === 'writeups' ? <WriteupsPage route={route} /> : <HomePage onWriteups={goWriteups} />}
      <Footer />
    </div>
  )
}

type HeaderProps = {
  menuOpen: boolean
  route: Route
  onHome: (event: MouseEvent<HTMLAnchorElement>) => void
  onMenuToggle: () => void
  onWriteups: (event: MouseEvent<HTMLAnchorElement>) => void
}

function HomePage({ onWriteups }: { onWriteups: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  return (
    <main id="main-content" className="home-page">
      <div className="home-content">
        <section className="home-hero">
          <p className="home-eyebrow"><span aria-hidden="true" /> KALI · SECURITY RESEARCH</p>
          <h1>{profile.name}</h1>
          <p className="home-affiliation">{profile.affiliation}</p>
          <p className="home-summary">정보보안 연구 · 취약점 분석 · CTF · AI 프로젝트</p>
          <div className="home-actions">
            <a className="home-primary" href="/writeups/" onClick={onWriteups}>
              연구 노트 보기 <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <a className="home-secondary" href={profile.github} rel="noopener noreferrer" target="_blank">
              <GitBranch className="size-4" aria-hidden="true" /> GitHub 프로필
            </a>
          </div>
        </section>
        <section className="home-results" aria-label="CTF 및 수상 기록">
          {achievementCategories.map((category) => {
            const results = activities.filter((activity) => activity.category === category)
            if (!results.length) return null
            return (
              <div className="home-result-group" key={category}>
                <h2>{category}</h2>
                <ul>
                  {results.map((result) => <li key={result.name}>{result.name}</li>)}
                </ul>
              </div>
            )
          })}
        </section>
      </div>
    </main>
  )
}

function Header({
  menuOpen,
  route,
  onHome,
  onMenuToggle,
  onWriteups,
}: HeaderProps) {
  const navClass = 'panel-nav-link'

  return (
    <header className="site-header fixed inset-x-0 top-0 z-50">
      <nav
        aria-label="주요 메뉴"
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
      >
        <a
          className="brand-lockup flex items-center gap-3"
          href="/"
          onClick={(event) => onHome(event)}
        >
          <img className="brand-logo" src="/favicon.svg" alt="" />
          <span className="leading-tight">
            <span className="brand-name block text-sm font-semibold">
              luxferre<span className="brand-prompt">@kali</span>
            </span>
            <span className="brand-path block text-xs">
              ~/security-lab
            </span>
          </span>
        </a>

        <div className="desktop-nav hidden items-center gap-1 p-1 md:flex">
          <a className={navClass} href="/" onClick={(event) => onHome(event)}>
            <span aria-hidden="true">~/</span> 홈
          </a>
          <a
            className={`${navClass} ${route.page === 'writeups' ? 'is-active' : ''}`}
            href="/writeups/"
            onClick={onWriteups}
          >
            <span aria-hidden="true">&gt;</span> 연구 노트
          </a>
          <a className={navClass} href={`mailto:${profile.email}`}>
            @ 연락
          </a>
        </div>

        <a
          className="header-github hidden items-center gap-2 px-3 py-2 text-sm font-medium md:inline-flex"
          href={profile.github}
          rel="noopener noreferrer"
          target="_blank"
        >
          <GitBranch className="size-4" aria-hidden="true" />
          git://github
        </a>

        <button
          className="mobile-menu-button grid size-10 place-items-center md:hidden"
          type="button"
          onClick={onMenuToggle}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>
      </nav>

      {menuOpen ? (
        <div id="mobile-navigation" className="mobile-navigation px-4 py-4 md:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            <a className={navClass} href="/" onClick={(event) => onHome(event)}>
              ~/ 홈
            </a>
            <a className={navClass} href="/writeups/" onClick={onWriteups}>
              &gt; 연구 노트
            </a>
            <a className={navClass} href={profile.github} rel="noopener noreferrer" target="_blank">
              git://github
            </a>
            <a className={navClass} href={`mailto:${profile.email}`}>
              @ 연락
            </a>
          </div>
        </div>
      ) : null}
    </header>
  )
}


type WriteupsPageProps = {
  route: Route
}

function WriteupsPage({ route }: WriteupsPageProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('전체')

  const filteredWriteups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return writeups.filter((writeup) => {
      const matchesCategory = category === '전체' || writeup.category === category
      const searchableText = [
        writeup.title,
        writeup.summary,
        writeup.category,
        writeup.difficulty,
        ...writeup.tags,
      ]
        .join(' ')
        .toLowerCase()
      const matchesQuery =
        normalizedQuery.length === 0 ||
        searchableText.includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [category, query])

  const selectedWriteup = route.slug
    ? writeups.find((writeup) => writeup.slug === route.slug)
    : undefined

  const selectWriteup = (
    event: MouseEvent<HTMLAnchorElement>,
    writeup: Writeup,
  ) => {
    event.preventDefault()
    window.history.pushState({}, '', `${writeupPath(writeup.slug)}/`)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main id="main-content" tabIndex={-1} className="section-shell writeups-page pt-32 pb-24">
      <SectionHeading
        icon={BookOpen}
        eyebrow="writeups"
        title="연구 노트"
        description={writeupsDescription}
        headingLevel={route.slug ? 'h2' : 'h1'}
      />

      <div className="writeups-layout">
        <nav aria-label="연구 노트 탐색" className="writeup-explorer">
          <div className="notebook-panel-heading">
            <h2>글 찾아보기</h2>
            <span>{filteredWriteups.length}건</span>
          </div>
          <div className="explorer-content">
            <label className="notebook-search">
              <Search className="size-4" aria-hidden="true" />
              <input
                type="search"
                aria-label="연구 노트 검색"
                placeholder="제목 · 태그 · 주제 검색"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <div className="writeup-categories" aria-label="카테고리">
              {categoryOptions.map((item) => (
                <button
                  className="filter-chip"
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="writeup-list" tabIndex={0} aria-label="연구 노트 목록">
              {filteredWriteups.map((writeup) => (
                <a
                  className="writeup-card"
                  href={`${writeupPath(writeup.slug)}/`}
                  key={writeup.slug}
                  aria-current={selectedWriteup?.slug === writeup.slug ? 'page' : undefined}
                  onClick={(event) => selectWriteup(event, writeup)}
                >
                  <span className="writeup-card-meta">{writeup.category} · {formatDate(writeup.date)}</span>
                  <span className="writeup-card-title">{writeup.title}</span>
                  <span className="writeup-card-summary">{writeup.summary}</span>
                </a>
              ))}
              {filteredWriteups.length === 0 ? (
                <p className="notebook-empty">조건에 맞는 글이 없습니다. 다른 검색어나 카테고리를 선택해 보세요.</p>
              ) : null}
            </div>
          </div>
        </nav>

        <section className="notebook-article">
          <div className="article-shell">
          {route.slug && selectedWriteup ? (
            <article className="min-w-0 [overflow-wrap:anywhere]">
              <div className="notebook-article-meta">
                <span className="notebook-category">
                  {selectedWriteup.category}
                </span>
                <span>{formatDate(selectedWriteup.date)}</span>
                <span>{selectedWriteup.readTime}</span>
              </div>
              <h1 className="notebook-article-title">
                {selectedWriteup.title}
              </h1>
              <p className="notebook-article-summary">
                {selectedWriteup.summary}
              </p>
              <div className="notebook-tags">
                {selectedWriteup.tags.map((tag) => (
                  <span className="mini-badge" key={tag}>
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children, ...props }) => (
                      <div className="markdown-table-scroll" role="region" aria-label="본문 표 · 좌우 스크롤" tabIndex={0}>
                        <table {...props}>{children}</table>
                      </div>
                    ),
                    a: ({ href, children, ...props }) => (
                      <a
                        href={href}
                        rel="noopener noreferrer"
                        target={href?.startsWith('http') ? '_blank' : undefined}
                        {...props}
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {selectedWriteup.content}
                </ReactMarkdown>
              </div>
            </article>
          ) : route.slug ? (
            <div className="grid min-h-[420px] place-items-center text-center">
              <div>
                <Terminal className="mx-auto size-10 text-slate-500" aria-hidden="true" />
                <p className="mt-4 text-slate-300">요청한 글을 찾을 수 없습니다.</p>
                <a className="mt-3 inline-block text-blue-300 underline" href="/writeups/">글 목록으로 돌아가기</a>
              </div>
            </div>
          ) : (
            <div className="notebook-welcome">
              <p className="notebook-welcome-kicker">처음 방문했다면</p>
              <h2>관심 있는 글부터 읽어보세요</h2>
              <p>
                보안과 개발을 공부하면서 직접 해본 일을 적고 있습니다. 완성된 결과뿐 아니라
                시작한 이유, 선택한 방법, 확인한 결과를 가능한 한 함께 남기려고 합니다.
              </p>
              <p>
                왼쪽에서 분야를 선택하거나 제목·태그로 검색할 수 있습니다. 무엇을 먼저 읽을지
                고민된다면 아래 세 글에서 시작해 보세요.
              </p>
              <div className="notebook-starting-points">
                {suggestedWriteups.map(({ slug, label, reason }) => {
                  const writeup = writeups.find((item) => item.slug === slug)
                  return writeup ? (
                    <a className="notebook-starting-point" href={`${writeupPath(slug)}/`} key={slug} onClick={(event) => selectWriteup(event, writeup)}>
                      <span>{label}</span>
                      <strong>{writeup.title}</strong>
                      <small>{reason}</small>
                      <span className="notebook-starting-point-action">글 읽기 <ArrowRight className="size-4" aria-hidden="true" /></span>
                    </a>
                  ) : null
                })}
              </div>
            </div>
          )}
          </div>
        </section>
      </div>
    </main>
  )
}

type SectionHeadingProps = {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
  headingLevel?: 'h1' | 'h2'
}

function SectionHeading({
  description,
  eyebrow,
  headingLevel = 'h2',
  icon: Icon,
  title,
}: SectionHeadingProps) {
  const Heading = headingLevel

  return (
    <div className="section-heading">
      <div className="section-prompt">
        <Icon className="size-4" aria-hidden="true" />
        <span>root@luxferre</span>:<b>~/{eyebrow}</b>$
      </div>
      <Heading className="section-title">
        {title}
      </Heading>
      <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
        {description}
      </p>
    </div>
  )
}

function BackgroundFX() {
  return (
    <div aria-hidden="true" className="ambient-background pointer-events-none fixed inset-0 z-0">
      <div className="ambient-red" />
      <div className="ambient-blue" />
      <div className="ambient-grid" />
      <div className="scanline" />
    </div>
  )
}

function Footer() {
  return (
    <footer className="system-footer relative z-10 px-4 py-5 text-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p><span className="footer-status" /> <span className="footer-wordmark">LUXFERRE@KALI</span> © 2026 {profile.name}</p>
        <a
          className="inline-flex items-center gap-2 transition"
          href={`${profile.siteUrl}/`}
        >
          {profile.siteUrl.replace('https://', '')}
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>
    </footer>
  )
}

export default App
