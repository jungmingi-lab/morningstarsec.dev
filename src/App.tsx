import {
  ArrowRight,
  Award,
  BookOpen,
  BrainCircuit,
  Car,
  Code2,
  Cpu,
  Download,
  ExternalLink,
  FileText,
  GitBranch,
  Globe2,
  GraduationCap,
  Mail,
  Menu,
  Radar,
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
import cyberHero from './assets/cyber-hero-optimized.jpg'
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

const categoryOptions: CategoryFilter[] = ['All', ...WRITEUP_CATEGORIES]

const projectIcons: LucideIcon[] = [BrainCircuit, Car, Utensils, Cpu]
const featuredProjects = projects.filter((project) => project.featured)
const contactIcons: Record<string, LucideIcon> = {
  Email: Mail,
  GitHub: GitBranch,
}

const matrixStreams = [
  { left: '5%', delay: '0s', duration: '16s', text: '0101 CVE TRACE' },
  { left: '17%', delay: '4s', duration: '20s', text: 'AUTH TOKEN HASH' },
  { left: '31%', delay: '1s', duration: '18s', text: 'FORENSIC LOG' },
  { left: '48%', delay: '7s', duration: '23s', text: 'AI RISK MAP' },
  { left: '64%', delay: '2s', duration: '17s', text: 'PACKET FLOW' },
  { left: '79%', delay: '5s', duration: '21s', text: 'CTF WRITEUP' },
  { left: '92%', delay: '3s', duration: '19s', text: 'SEC RESEARCH' },
]

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
    name: '정민기 정보보안 글 | CTF·취약점 분석·개발 기록',
    description:
      '정민기의 CTF 풀이, 취약점 분석, 디지털 포렌식, AI 보안 및 소프트웨어 개발 기록입니다.',
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
        ? '정민기 정보보안 글 | CTF·취약점 분석·개발 기록'
        : `정민기 | ${profile.title}`
    const description = selectedWriteup
      ? selectedWriteup.summary
      : route.page === 'writeups'
        ? '정민기의 CTF 풀이, 취약점 분석, 디지털 포렌식, AI 보안 및 소프트웨어 개발 기록입니다.'
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
    <div className="min-h-screen overflow-x-hidden bg-[#050711] text-slate-100">
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
        <main>
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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#050711]/70 backdrop-blur-2xl">
      <nav
        aria-label="주요 메뉴"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
      >
        <a
          className="flex items-center gap-3 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          href="/"
          onClick={(event) => onHome(event)}
        >
          <span className="grid size-10 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.16)]">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-white">
              {profile.name}
            </span>
            <span className="block text-xs text-slate-400">
              {profile.handle}
            </span>
          </span>
        </a>

        <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 md:flex">
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
          className="hidden items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/20 md:inline-flex"
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
        >
          {menuOpen ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>
      </nav>

      {menuOpen ? (
        <div className="border-t border-white/10 bg-[#080b16]/95 px-4 py-4 md:hidden">
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
    <section
      id="home"
      className="relative flex min-h-[92svh] items-center overflow-hidden pt-28"
    >
      <img
        className="absolute inset-y-0 right-0 h-full w-full object-cover opacity-55 mix-blend-screen"
        src={cyberHero}
        alt=""
        width="1672"
        height="941"
        fetchPriority="high"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(34,211,238,0.18),transparent_28%),linear-gradient(90deg,#050711_0%,rgba(5,7,17,0.9)_38%,rgba(5,7,17,0.54)_100%)]" />
      <div className="section-shell relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
            <Radar className="size-4" aria-hidden="true" />
            정민기 공식 포트폴리오
          </div>
          <h1 className="max-w-4xl break-words text-4xl font-semibold leading-[1.04] text-white sm:text-6xl lg:text-7xl">
            {profile.name}{' '}
            <span className="block text-slate-300">
              ({profile.romanizedName})
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-cyan-100 sm:text-xl">
            {profile.affiliation}
          </p>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            정민기는 대전대학교 AISW학부에서 정보보안과 취약점 분석을
            중심으로 CTF, 인공지능 및 소프트웨어 프로젝트를 수행하고
            있습니다. 이 사이트는 프로젝트, 수상, 연구 및 학습 기록을
            정리한 공식 포트폴리오입니다.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a className="primary-btn" href="/resume-minki-jung.pdf" download>
              <Download className="size-5" aria-hidden="true" />
              프로필 PDF 다운로드
            </a>
            <a
              className="secondary-btn"
              href={profile.github}
              rel="noopener noreferrer"
              target="_blank"
            >
              <GitBranch className="size-5" aria-hidden="true" />
              GitHub
            </a>
            <a
              className="secondary-btn"
              href="/#contact"
              onClick={(event) => onHome(event, 'contact')}
            >
              <Mail className="size-5" aria-hidden="true" />
              공개 연락 수단
            </a>
          </div>
        </div>

        <div className="glass-panel hidden p-5 lg:block">
          <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-4 text-sm text-slate-400">
            <span className="size-3 rounded-full bg-rose-400" />
            <span className="size-3 rounded-full bg-amber-300" />
            <span className="size-3 rounded-full bg-emerald-300" />
            <span className="ml-3 font-mono text-xs text-slate-500">
              profile.log
            </span>
          </div>
          <div className="space-y-4 font-mono text-sm leading-7 text-slate-300">
            <p className="terminal-line">
              <span className="text-cyan-300">$</span> whoami
            </p>
            <p className="text-slate-100">
              {profile.name} ({profile.romanizedName}) - {profile.affiliation}
            </p>
            <p className="terminal-line">
              <span className="text-cyan-300">$</span> interests --list
            </p>
            <div className="grid gap-2">
              {interests.map((interest) => (
                <span
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-cyan-100"
                  key={interest}
                >
                  {interest}
                </span>
              ))}
            </div>
            <a
              className="mt-2 inline-flex items-center gap-2 text-cyan-200 transition hover:text-white"
              href="/writeups/"
              onClick={onWriteups}
            >
              연구 및 기술 기록 열기 <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
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
        title="정보보안과 AI를 함께 탐구하는 대전대학교 AISW학부 학생"
        description="취약점 분석과 CTF 문제 해결을 바탕으로 디지털 포렌식, AI 보안, 소프트웨어 개발까지 학습하고 프로젝트로 구현합니다."
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
        title="AI, 서비스 개발, 보안 문제 해결을 연결한 프로젝트"
        description="소프트웨어 개발과 응용 AI, 보안 관점의 분석을 함께 다룬 정민기의 대표 작업입니다."
      />

      <div className="mt-12 grid gap-5 md:grid-cols-2">
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
        title="공개 근거로 확인할 수 있는 수상 기록"
        description="대회명과 결과를 공개 보도 자료에 연결해 확인할 수 있도록 정리했습니다."
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        {activities.map((activity) => (
          <article className="project-card" key={activity.name}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-cyan-200">
                  {activity.date && activity.displayDate ? (
                    <time dateTime={activity.date}>{activity.displayDate}</time>
                  ) : (
                    <span>수상 기록</span>
                  )}
                  {activity.team ? ` · ${activity.team}` : ''}
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
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-cyan-200 transition hover:text-white"
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
    <section className="section-shell py-20">
      <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] p-6 shadow-[0_0_60px_rgba(34,211,238,0.08)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-black/20 px-4 py-2 text-sm text-cyan-100">
              <FileText className="size-4" aria-hidden="true" />
              연구 및 학습 기록
            </div>
            <h2 className="max-w-3xl text-3xl font-semibold text-white sm:text-4xl">
              CTF 풀이, 취약점 분석, 디지털 포렌식, AI 보안 및 개발 과정을 기록합니다.
            </h2>
          </div>
          <a className="primary-btn w-full sm:w-fit" href="/writeups/" onClick={onWriteups}>
            전체 기술 기록 보기
            <ArrowRight className="size-5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section id="contact" className="section-shell scroll-mt-24 py-24">
      <SectionHeading
        icon={Mail}
        eyebrow="공개 연락 수단"
        title="정보보안 연구, CTF, 프로젝트에 관한 대화"
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
    <main className="section-shell pt-32 pb-24">
      <SectionHeading
        icon={BookOpen}
        eyebrow="연구 및 기술 기록"
        title={route.slug ? '정민기의 정보보안·개발 기록' : '정민기 정보보안 글과 CTF·취약점 분석 기록'}
        description="CTF 문제 풀이, 취약점 분석 방법론, 디지털 포렌식, AI 보안 및 프로젝트 개발 과정을 분류와 태그로 탐색할 수 있습니다."
        headingLevel={route.slug ? 'h2' : 'h1'}
      />

      <div className="mt-10 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-5">
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

          <div className="space-y-3">
            {filteredWriteups.map((writeup) => (
              <a
                className={`writeup-card ${
                  selectedWriteup?.slug === writeup.slug
                    ? 'border-cyan-300/45 bg-cyan-300/[0.09]'
                    : 'border-white/10 bg-white/[0.04]'
                }`}
                href={`${writeupPath(writeup.slug)}/`}
                key={writeup.slug}
                onClick={(event) => selectWriteup(event, writeup)}
              >
                <span className="text-xs font-medium text-cyan-200">
                  {writeup.category} / {writeup.difficulty}
                </span>
                <span className="mt-2 block text-base font-semibold text-white">
                  {writeup.title}
                </span>
                <span className="mt-2 block text-sm leading-6 text-slate-400">
                  {writeup.summary}
                </span>
              </a>
            ))}
          </div>
        </aside>

        <section className="glass-panel min-h-[620px] p-5 sm:p-8">
          {selectedWriteup ? (
            <article>
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
    <div className="max-w-3xl">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-cyan-100">
        <Icon className="size-4" aria-hidden="true" />
        {eyebrow}
      </div>
      <Heading className="text-3xl font-semibold leading-tight text-white sm:text-5xl">
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
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:72px_72px]" />
      <div className="matrix-rain">
        {matrixStreams.map((stream) => (
          <span
            className="matrix-stream"
            key={stream.left}
            style={{
              left: stream.left,
              animationDelay: stream.delay,
              animationDuration: stream.duration,
            }}
          >
            {stream.text}
          </span>
        ))}
      </div>
      <div className="scanline" />
    </div>
  )
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 px-4 py-8 text-sm text-slate-500">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 {profile.name}. 정민기 공식 포트폴리오.</p>
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
