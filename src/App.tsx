import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Car,
  Code2,
  Cpu,
  Download,
  ExternalLink,
  FileText,
  AtSign,
  BriefcaseBusiness,
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
import cyberHero from './assets/cyber-hero.png'
import {
  contactLinks,
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
const contactIcons: Record<string, LucideIcon> = {
  Email: Mail,
  GitHub: GitBranch,
  Blog: Globe2,
  LinkedIn: BriefcaseBusiness,
  'X (Twitter)': AtSign,
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
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
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
    window.history.pushState({}, '', '/writeups')
    setRoute({ page: 'writeups' })
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050711] text-slate-100">
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
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
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
              MorningStarSec
            </span>
            <span className="block text-xs text-slate-400">
              {profile.romanizedName}
            </span>
          </span>
        </a>

        <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 md:flex">
          <a className={navClass} href="/" onClick={(event) => onHome(event)}>
            Home
          </a>
          <a
            className={navClass}
            href="/#about"
            onClick={(event) => onHome(event, 'about')}
          >
            About
          </a>
          <a
            className={navClass}
            href="/#projects"
            onClick={(event) => onHome(event, 'projects')}
          >
            Projects
          </a>
          <a
            className={`${navClass} ${
              route.page === 'writeups' ? 'bg-cyan-300/10 text-cyan-100' : ''
            }`}
            href="/writeups"
            onClick={onWriteups}
          >
            Writeups
          </a>
          <a
            className={navClass}
            href="/#contact"
            onClick={(event) => onHome(event, 'contact')}
          >
            Contact
          </a>
        </div>

        <a
          className="hidden items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/20 md:inline-flex"
          href={profile.github}
          rel="noreferrer"
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
          aria-label="Toggle navigation menu"
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
              Home
            </a>
            <a
              className={navClass}
              href="/#about"
              onClick={(event) => onHome(event, 'about')}
            >
              About
            </a>
            <a
              className={navClass}
              href="/#projects"
              onClick={(event) => onHome(event, 'projects')}
            >
              Projects
            </a>
            <a className={navClass} href="/writeups" onClick={onWriteups}>
              Writeups
            </a>
            <a
              className={navClass}
              href="/#contact"
              onClick={(event) => onHome(event, 'contact')}
            >
              Contact
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
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(34,211,238,0.18),transparent_28%),linear-gradient(90deg,#050711_0%,rgba(5,7,17,0.9)_38%,rgba(5,7,17,0.54)_100%)]" />
      <div className="section-shell relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
            <Radar className="size-4" aria-hidden="true" />
            Security research portfolio
          </div>
          <h1 className="max-w-4xl break-words text-4xl font-semibold leading-[1.04] text-white sm:text-6xl lg:text-7xl">
            {profile.name}{' '}
            <span className="block text-slate-300">
              ({profile.romanizedName})
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-cyan-100 sm:text-xl">
            {profile.title}
          </p>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Building a practical foundation in web security, vulnerability
            research, CTF problem solving, digital forensics, and AI security
            through projects and technical writeups.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a className="primary-btn" href="/resume-minki-jung.pdf" download>
              <Download className="size-5" aria-hidden="true" />
              Download Resume
            </a>
            <a
              className="secondary-btn"
              href={profile.github}
              rel="noreferrer"
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
              Contact
            </a>
          </div>
        </div>

        <div className="glass-panel hidden p-5 lg:block">
          <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-4 text-sm text-slate-400">
            <span className="size-3 rounded-full bg-rose-400" />
            <span className="size-3 rounded-full bg-amber-300" />
            <span className="size-3 rounded-full bg-emerald-300" />
            <span className="ml-3 font-mono text-xs text-slate-500">
              research.log
            </span>
          </div>
          <div className="space-y-4 font-mono text-sm leading-7 text-slate-300">
            <p className="terminal-line">
              <span className="text-cyan-300">$</span> whoami
            </p>
            <p className="text-slate-100">
              {profile.romanizedName} - cybersecurity student
            </p>
            <p className="terminal-line">
              <span className="text-cyan-300">$</span> focus --list
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
              href="/writeups"
              onClick={onWriteups}
            >
              open /writeups <ArrowRight className="size-4" aria-hidden="true" />
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
        eyebrow="About"
        title="Security research foundation with applied AI context."
        description="A portfolio centered on rigorous learning, practical projects, and clear technical communication."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel p-6">
          <div className="mb-6 grid size-12 place-items-center rounded-lg border border-purple-300/25 bg-purple-300/10 text-purple-100">
            <GraduationCap className="size-6" aria-hidden="true" />
          </div>
          <h3 className="text-2xl font-semibold text-white">
            {profile.university}
          </h3>
          <p className="mt-3 text-slate-300">{profile.department}</p>
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
            <h3 className="text-xl font-semibold text-white">Skills</h3>
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
              ['Research', 'Vulnerability notes, CTF methodology'],
              ['Engineering', 'React, TypeScript, practical web apps'],
              ['Analysis', 'Forensics, traffic review, AI risk thinking'],
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
        eyebrow="Projects"
        title="Applied systems across AI, services, and security challenges."
        description="Selected work that connects software engineering, applied AI, and security-oriented analysis."
      />

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {projects.map((project, index) => {
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
              Technical Notes
            </div>
            <h2 className="max-w-3xl text-3xl font-semibold text-white sm:text-4xl">
              Markdown-based notes for security research and development projects.
            </h2>
          </div>
          <a className="primary-btn w-full sm:w-fit" href="/writeups" onClick={onWriteups}>
            Browse Writeups
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
        eyebrow="Contact"
        title="Open to security research, CTF collaboration, and project conversations."
        description="Direct contact channels and placeholders for future public profiles."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {contactLinks.map((link) => {
          const Icon = contactIcons[link.label] ?? Globe2
          const cardClass = `contact-card ${
            link.active
              ? 'hover:border-cyan-300/40 hover:bg-cyan-300/10'
              : 'cursor-default opacity-75'
          }`
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

          if (!link.active || !link.href) {
            return (
              <div
                className={cardClass}
                key={link.label}
                aria-disabled="true"
              >
                {cardContent}
              </div>
            )
          }

          return (
            <a
              className={cardClass}
              href={link.href}
              key={link.label}
              rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
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

  const selectedWriteup =
    writeups.find((writeup) => writeup.slug === route.slug) ??
    filteredWriteups[0]

  const selectWriteup = (
    event: MouseEvent<HTMLAnchorElement>,
    writeup: Writeup,
  ) => {
    event.preventDefault()
    window.history.pushState({}, '', `/writeups/${writeup.slug}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="section-shell pt-32 pb-24">
      <SectionHeading
        icon={BookOpen}
        eyebrow="Technical Notes"
        title="Searchable Markdown notes by category and tag."
        description="A dedicated section for challenge analysis, methodology, development logs, and project documentation."
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
              placeholder="Search writeups, tags, techniques"
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
                href={`/writeups/${writeup.slug}`}
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
              <h1 className="mt-6 text-3xl font-semibold leading-tight text-white sm:text-5xl">
                {selectedWriteup.title}
              </h1>
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
                        rel="noreferrer"
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
                <p className="mt-4 text-slate-300">No writeups found.</p>
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
}

function SectionHeading({
  description,
  eyebrow,
  icon: Icon,
  title,
}: SectionHeadingProps) {
  return (
    <div className="max-w-3xl">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-cyan-100">
        <Icon className="size-4" aria-hidden="true" />
        {eyebrow}
      </div>
      <h2 className="text-3xl font-semibold leading-tight text-white sm:text-5xl">
        {title}
      </h2>
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
        <p>© 2026 MorningStarSec. Built with React, TypeScript, Vite, and Tailwind CSS.</p>
        <a
          className="inline-flex items-center gap-2 text-slate-400 transition hover:text-cyan-100"
          href={profile.domain}
        >
          {profile.domain.replace('https://', '')}
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>
    </footer>
  )
}

export default App
