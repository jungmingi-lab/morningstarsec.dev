import {
  ArrowRight,
  Award,
  BookOpen,
  BrainCircuit,
  Car,
  Code2,
  Cpu,
  ExternalLink,
  FileText,
  GitBranch,
  Globe2,
  GraduationCap,
  Mail,
  Menu,
  Search,
  ShieldCheck,
  Terminal,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  activities,
  contactLinks,
  externalProfiles,
  interests,
  profile,
  projects,
  skills,
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

type CategoryFilter = 'All' | WriteupCategory

const categoryOptions: CategoryFilter[] = [
  'All',
  ...WRITEUP_CATEGORIES.filter((category) =>
    writeups.some((writeup) => writeup.category === category),
  ),
]

const projectIcons: LucideIcon[] = [BrainCircuit, Car, Utensils, Cpu]
const featuredProjects = projects.filter((project) => project.featured)
const contactIcons: Record<string, LucideIcon> = {
  Email: Mail,
  GitHub: GitBranch,
}

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

function scrollToSection(id: string) {
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  })
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
    name: '공부 기록',
    description: '취약점 분석 방법론, 프로젝트 개발 과정을 서술합니다.',
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
        ? '공부 기록 | 정민기'
        : `정민기 | ${profile.title}`
    const description = selectedWriteup
      ? selectedWriteup.summary
      : route.page === 'writeups'
        ? '취약점 분석 방법론, 프로젝트 개발 과정을 서술합니다.'
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

  useEffect(() => {
    if (route.page === 'home' && window.location.hash) {
      scrollToSection(window.location.hash.slice(1))
    }
  }, [route])

  const goHome = (event: MouseEvent<HTMLAnchorElement>, targetId?: string) => {
    event.preventDefault()
    const nextPath = targetId ? `/#${targetId}` : '/'
    window.history.pushState({}, '', nextPath)
    setRoute({ page: 'home' })
    setMenuOpen(false)

    if (targetId) {
      scrollToSection(targetId)
      return
    }

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
      <BackgroundFX />
      <Header
        menuOpen={menuOpen}
        route={route}
        onHome={goHome}
        onMenuToggle={() => setMenuOpen((isOpen) => !isOpen)}
        onWriteups={goWriteups}
      />
      {route.page === 'writeups' ? (
        <WriteupsPage route={route} />
      ) : (
        <main id="main-content" tabIndex={-1}>
          <Hero onHome={goHome} onWriteups={goWriteups} />
          <About />
          <Projects />
          <Activities />
          <WriteupsPreview onWriteups={goWriteups} />
          <Contact />
        </main>
      )}
      <Footer />
    </div>
  )
}

type HeaderProps = {
  menuOpen: boolean
  route: Route
  onHome: (event: MouseEvent<HTMLAnchorElement>, targetId?: string) => void
  onMenuToggle: () => void
  onWriteups: (event: MouseEvent<HTMLAnchorElement>) => void
}

function Header({
  menuOpen,
  route,
  onHome,
  onMenuToggle,
  onWriteups,
}: HeaderProps) {
  const navClass =
    'rounded-full px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300'

  return (
    <header className="site-header fixed inset-x-0 top-0 z-50">
      <nav
        aria-label="주요 메뉴"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
      >
        <a
          className="flex items-center gap-3 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          href="/"
          onClick={(event) => onHome(event)}
        >
          <span className="brand-symbol" aria-hidden="true">
            <span />
          </span>
          <span className="leading-tight">
            <span className="brand-name block text-sm font-semibold text-white">
              LUXFERRE<span className="brand-dot">.</span>
            </span>
            <span className="block text-xs text-slate-400">
              SECURITY & AI RESEARCH
            </span>
          </span>
        </a>

        <div className="desktop-nav hidden items-center gap-1 p-1 md:flex">
          <a className={navClass} href="/" onClick={(event) => onHome(event)}>
            홈
          </a>
          <a
            className={navClass}
            href="/#about"
            onClick={(event) => onHome(event, 'about')}
          >
            소개
          </a>
          <a
            className={navClass}
            href="/#projects"
            onClick={(event) => onHome(event, 'projects')}
          >
            프로젝트
          </a>
          <a
            className={navClass}
            href="/#activities"
            onClick={(event) => onHome(event, 'activities')}
          >
            수상·활동
          </a>
          <a
            className={`${navClass} ${
              route.page === 'writeups' ? 'bg-cyan-300/10 text-cyan-100' : ''
            }`}
            href="/writeups/"
            onClick={onWriteups}
          >
            연구·글
          </a>
          <a
            className={navClass}
            href="/#contact"
            onClick={(event) => onHome(event, 'contact')}
          >
            연락
          </a>
        </div>

        <a
          className="header-github hidden items-center gap-2 px-4 py-2 text-sm font-medium md:inline-flex"
          href={profile.github}
          rel="noopener noreferrer"
          target="_blank"
        >
          <GitBranch className="size-4" aria-hidden="true" />
          GitHub
        </a>

        <button
          className="grid size-10 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-slate-200 md:hidden"
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
        <div id="mobile-navigation" className="mobile-navigation border-t border-white/10 px-4 py-4 md:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            <a className={navClass} href="/" onClick={(event) => onHome(event)}>
              홈
            </a>
            <a
              className={navClass}
              href="/#about"
              onClick={(event) => onHome(event, 'about')}
            >
              소개
            </a>
            <a
              className={navClass}
              href="/#projects"
              onClick={(event) => onHome(event, 'projects')}
            >
              프로젝트
            </a>
            <a
              className={navClass}
              href="/#activities"
              onClick={(event) => onHome(event, 'activities')}
            >
              수상·활동
            </a>
            <a className={navClass} href="/writeups/" onClick={onWriteups}>
              연구·글
            </a>
            <a
              className={navClass}
              href="/#contact"
              onClick={(event) => onHome(event, 'contact')}
            >
              연락
            </a>
          </div>
        </div>
      ) : null}
    </header>
  )
}

type HeroProps = {
  onHome: (event: MouseEvent<HTMLAnchorElement>, targetId?: string) => void
  onWriteups: (event: MouseEvent<HTMLAnchorElement>) => void
}

function Hero({ onHome, onWriteups }: HeroProps) {
  return (
    <section id="home" className="hero">
      <div className="hero-orbit" aria-hidden="true">
        <svg viewBox="0 0 1200 720" fill="none">
          <defs>
            <linearGradient id="orbit-red" x1="170" y1="80" x2="1000" y2="630" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ff1846" stopOpacity="0" />
              <stop offset=".4" stopColor="#ff1846" />
              <stop offset=".7" stopColor="#ff627e" />
              <stop offset="1" stopColor="#ff1846" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="orbit-blue" x1="200" y1="650" x2="1000" y2="60" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0070ff" stopOpacity="0" />
              <stop offset=".45" stopColor="#307bff" />
              <stop offset="1" stopColor="#0070ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="orbit-traces" stroke="url(#orbit-red)">
            <ellipse cx="600" cy="360" rx="460" ry="182" transform="rotate(-26 600 360)" />
            <ellipse cx="600" cy="360" rx="425" ry="155" transform="rotate(-26 600 360)" strokeDasharray="2 7" />
            <ellipse cx="600" cy="360" rx="490" ry="205" transform="rotate(-26 600 360)" strokeOpacity=".3" />
          </g>
          <g stroke="url(#orbit-blue)">
            <ellipse cx="600" cy="360" rx="425" ry="170" transform="rotate(32 600 360)" />
            <ellipse cx="600" cy="360" rx="455" ry="193" transform="rotate(32 600 360)" strokeOpacity=".3" />
          </g>
          <circle cx="600" cy="360" r="256" stroke="#a5b4fc" strokeOpacity=".1" strokeDasharray="2 10" />
          <path d="M600 65v26M600 629v26M285 360h26M889 360h26" stroke="#b5bdcc" strokeOpacity=".4" />
        </svg>
      </div>
      <div className="hero-content section-shell">
        <p className="hero-kicker"><span className="signal-dot" /> INDEPENDENT SECURITY RESEARCH</p>
        <h1 className="hero-wordmark" aria-label="LUXFERRE — 정민기 정보보안 포트폴리오">
          <span data-text="LUXFERRE">LUXFERRE</span><span className="hero-period" aria-hidden="true">_</span>
        </h1>
        <p className="hero-subtitle">QUESTION. BREAK. <span>UNDERSTAND.</span></p>
        <div className="hero-identity">
          <p>{profile.name} <span>/ {profile.romanizedName}</span></p>
          <span className="hero-identity-divider" aria-hidden="true" />
          <p>{profile.affiliation}</p>
        </div>
        <p className="hero-description">시스템의 경계를 탐구하고, 취약점의 본질을 이해합니다.<br className="hidden sm:block" /> 정보보안 · CTF · AI 보안 연구와 개발의 기록.</p>
        <div className="hero-actions">
          <a className="primary-btn" href="/writeups/" onClick={onWriteups}>연구 기록 살펴보기 <ArrowRight className="size-4" aria-hidden="true" /></a>
          <a className="secondary-btn" href="/#about" onClick={(event) => onHome(event, 'about')}>소개 <ArrowRight className="size-4" aria-hidden="true" /></a>
        </div>
      </div>
      <div className="hero-bottom section-shell">
        <span>SECURITY / CTF / ARTIFICIAL INTELLIGENCE</span>
        <a href="/#about" onClick={(event) => onHome(event, 'about')}>SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a>
        <span>DAEJEON, KR <span className="text-accent">↗</span></span>
      </div>
    </section>
  )
}

function About() {
  return (
    <section id="about" className="section-shell scroll-mt-24 py-24">
      <SectionHeading
        icon={GraduationCap}
        eyebrow="소개"
        title="BEYOND THE SURFACE"
        description="대전대학교 AISW학부에서 정보보안과 AI를 탐구합니다. 취약점 분석과 CTF 문제 해결을 바탕으로 디지털 포렌식, AI 보안, 소프트웨어 개발까지 학습하고 구현합니다."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel p-6">
          <div className="mb-6 grid size-12 place-items-center rounded-lg border border-purple-300/25 bg-purple-300/10 text-purple-100">
            <GraduationCap className="size-6" aria-hidden="true" />
          </div>
          <h3 className="text-2xl font-semibold text-white">
            {profile.affiliation}
          </h3>
          <p className="mt-3 leading-7 text-slate-300">
            정보보안과 취약점 분석을 중심으로 인공지능 및 소프트웨어 개발
            역량을 함께 쌓고 있습니다.
          </p>
          <a
            className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-200 transition hover:text-white"
            href={profile.departmentUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            대전대학교 AI소프트웨어학부 공식 홈페이지
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
          <div className="mt-8 grid gap-3">
            {interests.map((interest) => (
              <div
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3"
                key={interest}
              >
                <span className="grid size-8 place-items-center rounded-lg bg-cyan-300/10 text-cyan-200">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-slate-200">
                  {interest}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center gap-3">
            <Code2 className="size-5 text-cyan-200" aria-hidden="true" />
            <h3 className="text-xl font-semibold text-white">기술 및 도구</h3>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {skills.map((skill) => (
              <span className="skill-badge" key={skill}>
                {skill}
              </span>
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ['연구', '취약점 분석 기록과 CTF 문제 해결 방법론'],
              ['개발', 'React, TypeScript 기반 웹 애플리케이션'],
              ['분석', '디지털 포렌식, 트래픽 분석, AI 위험 검토'],
            ].map(([label, value]) => (
              <div
                className="rounded-lg border border-white/10 bg-[#0b1020]/70 p-4"
                key={label}
              >
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Projects() {
  return (
    <section id="projects" className="section-shell scroll-mt-24 py-24">
      <SectionHeading
        icon={Cpu}
        eyebrow="대표 프로젝트"
        title="SELECTED WORK"
        description="소프트웨어 개발과 응용 AI, 보안 관점의 분석을 함께 다룬 정민기의 대표 작업입니다."
      />

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {featuredProjects.length === 0 ? (
          <div className="glass-panel p-8 md:col-span-2">
            <p className="text-sm text-slate-400">공개 프로젝트를 정리하고 있습니다. 연구 및 개발 과정은 기술 기록에서 확인할 수 있습니다.</p>
            <a className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-200" href="/writeups/">기술 기록 보기 <ArrowRight className="size-4" aria-hidden="true" /></a>
          </div>
        ) : null}
        {featuredProjects.map((project, index) => {
          const Icon = projectIcons[index] ?? Cpu

          return (
            <article className="project-card" key={project.name}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-cyan-200">
                    {project.eyebrow}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {project.name}
                  </h3>
                </div>
                <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-blue-300/20 bg-blue-300/10 text-blue-100">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-5 leading-7 text-slate-300">
                {project.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {project.stack.map((item) => (
                  <span className="mini-badge" key={item}>
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-sm text-slate-500">{project.status}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Activities() {
  return (
    <section id="activities" className="section-shell scroll-mt-24 py-24">
      <SectionHeading
        icon={Award}
        eyebrow="수상 및 활동"
        title="MILESTONES"
        description="대회명과 결과를 공개 보도 자료에 연결해 확인할 수 있도록 정리했습니다."
      />

      <div className="activity-grid mt-12 grid gap-5 lg:grid-cols-2">
        {activities.map((activity) => (
          <article className="activity-card" key={activity.name}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-cyan-200">
                  {activity.date && activity.displayDate ? (
                    <time dateTime={activity.date}>{activity.displayDate}</time>
                  ) : (
                    <span>활동 기록</span>
                  )}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {activity.name}
                </h3>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-purple-300/20 bg-purple-300/10 text-purple-100">
                <Award className="size-6" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-5 leading-7 text-slate-300">
              {activity.description}
            </p>
            {activity.evidenceUrl && activity.evidenceLabel ? (
              <a
                className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium text-cyan-200 transition hover:text-white"
                href={activity.evidenceUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {activity.evidenceLabel}
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            ) : null}
          </article>
        ))}

        <div className="glass-panel p-6">
          <div className="flex items-center gap-3">
            <Globe2 className="size-5 text-cyan-200" aria-hidden="true" />
            <h3 className="text-xl font-semibold text-white">외부 공식 링크</h3>
          </div>
          <div className="mt-6 grid gap-3">
            {externalProfiles.map((externalProfile) => (
              <a
                className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
                href={externalProfile.href}
                key={externalProfile.label}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="block font-medium text-white">
                  {externalProfile.label}
                </span>
                <span className="mt-2 block text-sm text-slate-400">
                  {externalProfile.value}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

type WriteupsPreviewProps = {
  onWriteups: (event: MouseEvent<HTMLAnchorElement>) => void
}

function WriteupsPreview({ onWriteups }: WriteupsPreviewProps) {
  return (
    <section className="section-shell research-section py-24">
      <SectionHeading icon={FileText} eyebrow="연구 및 기술 기록" title="RESEARCH LOG" description="취약점의 발견부터 원인 분석과 패치 검증까지, 연구 과정을 기록합니다." />
      <div className="research-list mt-12">
        {writeups.slice(0, 3).map((writeup, index) => (
          <a className="research-row" href={`${writeupPath(writeup.slug)}/`} key={writeup.slug}>
            <span className="research-number">0{index + 1}</span>
            <div>
              <span className="research-meta">{writeup.category} <span>/</span> {formatDate(writeup.date)}</span>
              <h3>{writeup.title}</h3>
              <p>{writeup.summary}</p>
            </div>
            <ArrowRight className="research-arrow size-5" aria-hidden="true" />
          </a>
        ))}
      </div>
      <a className="secondary-btn mt-8" href="/writeups/" onClick={onWriteups}>전체 기술 기록 보기 <ArrowRight className="size-4" aria-hidden="true" /></a>
    </section>
  )
}

function Contact() {
  return (
    <section id="contact" className="section-shell scroll-mt-24 py-24">
      <SectionHeading
        icon={Mail}
        eyebrow="공개 연락 수단"
        title="LET’S CONNECT"
        description="현재 이 사이트에서 공개한 이메일과 GitHub 프로필을 통해 연락할 수 있습니다."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {contactLinks.map((link) => {
          const Icon = contactIcons[link.label] ?? Globe2
          const cardClass =
            'contact-card hover:border-cyan-300/40 hover:bg-cyan-300/10'
          const cardContent = (
            <>
              <Icon className="size-5 text-cyan-200" aria-hidden="true" />
              <span className="mt-5 block text-sm text-slate-400">
                {link.label}
              </span>
              <span className="mt-2 block break-words text-sm font-medium text-white">
                {link.value}
              </span>
            </>
          )

          return (
            <a
              className={cardClass}
              href={link.href}
              key={link.label}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              target={link.href.startsWith('http') ? '_blank' : undefined}
            >
              {cardContent}
            </a>
          )
        })}
      </div>
    </section>
  )
}

type WriteupsPageProps = {
  route: Route
}

function WriteupsPage({ route }: WriteupsPageProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('All')

  const filteredWriteups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return writeups.filter((writeup) => {
      const matchesCategory = category === 'All' || writeup.category === category
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
    : filteredWriteups[0]
  const ArticleHeading = route.slug ? 'h1' : 'h2'

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
        eyebrow="연구 및 기술 기록"
        title="RESEARCH LOG"
        description="취약점 분석 방법론, 프로젝트 개발 과정을 서술합니다."
        headingLevel={route.slug ? 'h2' : 'h1'}
      />

      <div className="mt-10 flex min-w-0 flex-col gap-6">
        <nav aria-label="기술 기록 탐색" className="glass-panel min-w-0 space-y-4 p-4 sm:p-5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              className="h-12 w-full rounded-lg border border-white/10 bg-white/[0.06] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/[0.08]"
              type="search"
              aria-label="기술 기록 검색"
              placeholder="제목, 태그, 기법 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((item) => (
              <button
                className={`filter-chip ${
                  category === item
                    ? 'border-cyan-300/50 bg-cyan-300/15 text-cyan-100'
                    : 'border-white/10 bg-white/[0.04] text-slate-300'
                }`}
                key={item}
                type="button"
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex gap-3 overflow-x-auto py-1" tabIndex={0} aria-label="기술 기록 목록">
            {filteredWriteups.map((writeup) => (
              <a
                className={`writeup-card w-64 shrink-0 sm:w-72 ${
                  selectedWriteup?.slug === writeup.slug
                    ? 'border-cyan-300/45 bg-cyan-300/[0.09]'
                    : 'border-white/10 bg-white/[0.04]'
                }`}
                href={`${writeupPath(writeup.slug)}/`}
                key={writeup.slug}
                aria-current={selectedWriteup?.slug === writeup.slug ? 'page' : undefined}
                onClick={(event) => selectWriteup(event, writeup)}
              >
                <span className="text-xs font-medium text-cyan-200">
                  {writeup.category} / {writeup.difficulty}
                </span>
                <span className="mt-2 block text-base font-semibold text-white">
                  {writeup.title}
                </span>
              </a>
            ))}
          </div>
          {filteredWriteups.length === 0 ? (
            <p className="text-sm text-slate-400">조건에 맞는 기술 기록이 없습니다.</p>
          ) : null}
        </nav>

        <section className="glass-panel min-h-[620px] min-w-0 p-5 sm:p-8 lg:p-10">
          {selectedWriteup ? (
            <article className="min-w-0 [overflow-wrap:anywhere]">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-cyan-100">
                  {selectedWriteup.category}
                </span>
                <span>{formatDate(selectedWriteup.date)}</span>
                <span>{selectedWriteup.readTime}</span>
              </div>
              <ArticleHeading className="mt-6 text-3xl font-semibold leading-tight text-white sm:text-5xl">
                {selectedWriteup.title}
              </ArticleHeading>
              <p className="mt-5 max-w-3xl leading-7 text-slate-300">
                {selectedWriteup.summary}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {selectedWriteup.tags.map((tag) => (
                  <span className="mini-badge" key={tag}>
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="markdown-body mt-10">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children, ...props }) => (
                      <div className="markdown-table-scroll" role="region" aria-label="본문 표 — 좌우로 스크롤할 수 있습니다" tabIndex={0}>
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
          ) : (
            <div className="grid min-h-[420px] place-items-center text-center">
              <div>
                <Terminal className="mx-auto size-10 text-slate-500" aria-hidden="true" />
                <p className="mt-4 text-slate-300">조건에 맞는 기술 기록이 없습니다.</p>
              </div>
            </div>
          )}
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
      <div className="section-eyebrow">
        <Icon className="size-4" aria-hidden="true" />
        {eyebrow}
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
    <footer className="relative z-10 border-t border-white/10 px-4 py-8 text-sm text-slate-500">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p><span className="footer-wordmark">LUXFERRE.</span> © 2026 {profile.name}</p>
        <a
          className="inline-flex items-center gap-2 text-slate-400 transition hover:text-cyan-100"
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
