import { useEffect, useRef, useState, type ReactNode } from 'react'
import { WRITEUP_CATEGORIES, writeups } from './lib/writeups'

const commands = ['help', 'whoami', 'projects', 'activities', 'contact', 'categories', 'ls', 'open', 'clear']
type Entry = { command: string; output: ReactNode }

export default function TerminalHome({ sections }: { sections: Record<string, ReactNode> }) {
  const [entries, setEntries] = useState<Entry[]>(() => {
    const requested = window.location.hash.slice(1)
    const command = requested === 'about' ? 'whoami' : requested
    return Object.hasOwn(sections, command) ? [{ command, output: sections[command] }] : []
  })
  const [value, setValue] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [position, setPosition] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const prompt = useRef<HTMLFormElement>(null)
  useEffect(() => { if (entries.length) prompt.current?.scrollIntoView({ block: 'nearest' }) }, [entries])

  function run(raw: string) {
    const command = raw.trim()
    if (!command) return
    const [name, ...args] = command.split(/\s+/)
    const argument = args.join(' ')
    setHistory(previous => [...previous, command])
    setPosition(0)
    setValue('')
    if (name === 'clear') { setEntries([]); input.current?.focus(); return }
    let output: ReactNode
    if (name === 'help') output = <pre>{'whoami        소개 / 관심 분야\nprojects      개발 프로젝트\nactivities    수상 및 활동\ncontact       연락처\ncategories    카테고리 목록\nls            전체 글 목록\nls <카테고리> 해당 카테고리의 글\nopen <번호>   글 읽기\nclear         화면 지우기\n\n↑ ↓ 명령 기록 · Tab 자동완성 · Ctrl+L 화면 지우기'}</pre>
    else if (Object.hasOwn(sections, name)) output = sections[name]
    else if (name === 'categories') output = <pre>{WRITEUP_CATEGORIES.join('\n')}<br />{'\n사용 예: ls CTF/Wargame'}</pre>
    else if (name === 'ls') {
      const matches = writeups.filter(post => !argument || post.category === argument)
      output = matches.length ? <div className="shell-files">{matches.map(post => <p key={post.slug}><span>{String(writeups.indexOf(post) + 1).padStart(2, '0')}  </span><a href={`/writeups/${encodeURIComponent(post.slug)}/`}>{post.title}</a><small>  {post.category}</small></p>)}<p className="shell-muted">글 열기: open &lt;번호&gt; 또는 제목 선택</p></div> : <p className="shell-notice">공개 글 없음 · 카테고리 확인: categories</p>
    } else if (name === 'open') {
      const post = /^\d+$/.test(argument) ? writeups[Number(argument) - 1] : undefined
      if (post) { window.location.assign(`/writeups/${encodeURIComponent(post.slug)}/`); return }
      output = <p className="shell-notice">사용법: open &lt;번호&gt; · 글 번호 확인: ls</p>
    } else output = <p className="shell-notice">등록되지 않은 명령어: {name} · 명령어 목록: help</p>
    setEntries(previous => [...previous, { command, output }])
    input.current?.focus()
  }

  return <main id="main-content" className="shell-desktop">
    <section className="interactive-shell" aria-label="Luxferre 포트폴리오 터미널">
      <div className="shell-titlebar"><img src="/favicon.svg" alt="" /><span>luxferre@kali: ~</span><span aria-hidden="true">─ □ ×</span></div>
      <div className="shell-screen">
        <h1>Luxferre</h1>
        <p className="shell-muted">정보보안 연구 · 소프트웨어 개발 기록</p>
        <p className="shell-welcome"><button onClick={() => run('help')}>help</button><span className="shell-muted"> — 명령어 안내</span></p>
        <div aria-live="polite" aria-relevant="additions">{entries.map((entry, index) => <div className="shell-entry" key={index}><p className="shell-echo"><span>luxferre@kali</span>:~$ {entry.command}</p><div className="shell-result">{entry.output}</div></div>)}</div>
        <form ref={prompt} className="shell-prompt" onSubmit={event => { event.preventDefault(); run(value) }}>
          <label htmlFor="shell-command"><span>luxferre@kali</span>:~$</label>
          <input ref={input} id="shell-command" aria-label="터미널 명령어" autoComplete="off" autoCapitalize="off" spellCheck={false} value={value} onChange={event => setValue(event.target.value)} onKeyDown={event => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); const next = Math.max(0, Math.min(history.length, position + (event.key === 'ArrowUp' ? 1 : -1))); setPosition(next); setValue(next ? history[history.length - next] : '') }
            if (event.key === 'Tab' && value && !event.shiftKey) { const matches = commands.filter(command => command.startsWith(value)); if (matches.length === 1) { event.preventDefault(); setValue(matches[0]) } }
            if (event.ctrlKey && event.key.toLowerCase() === 'l') { event.preventDefault(); setEntries([]) }
          }} />
          <button type="submit" aria-label="명령어 실행">↵</button>
        </form>
      </div>
    </section>
  </main>
}
