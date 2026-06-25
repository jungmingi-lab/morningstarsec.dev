export const WRITEUP_CATEGORIES = [
  'Web',
  'Pwn',
  'Reversing',
  'Forensics',
  'Development',
  'Dreamhack',
  'Misc',
] as const

export type WriteupCategory = (typeof WRITEUP_CATEGORIES)[number]

export type Writeup = {
  slug: string
  title: string
  category: WriteupCategory
  date: string
  summary: string
  tags: string[]
  difficulty: string
  readTime: string
  content: string
}

type FrontmatterValue = string | string[]
type Frontmatter = Record<string, FrontmatterValue>

const modules = import.meta.glob<string>('../writeups/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
})

function parseFrontmatter(raw: string, filePath: string): Writeup {
  const [, frontmatterBlock = '', body = raw] =
    raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/) ?? []
  const frontmatter = frontmatterBlock
    .split('\n')
    .filter(Boolean)
    .reduce<Frontmatter>((metadata, line) => {
      const separatorIndex = line.indexOf(':')

      if (separatorIndex === -1) {
        return metadata
      }

      const key = line.slice(0, separatorIndex).trim()
      const rawValue = line.slice(separatorIndex + 1).trim()
      metadata[key] = parseFrontmatterValue(rawValue)
      return metadata
    }, {})

  const slug = filePath.split('/').pop()?.replace(/\.md$/, '') ?? 'writeup'
  const category = normalizeCategory(frontmatter.category)

  return {
    slug,
    title: String(frontmatter.title ?? slug),
    category,
    date: String(frontmatter.date ?? '2026-01-01'),
    summary: String(frontmatter.summary ?? ''),
    tags: normalizeTags(frontmatter.tags),
    difficulty: String(frontmatter.difficulty ?? 'Practice'),
    readTime: String(frontmatter.readTime ?? '5 min read'),
    content: body.trim(),
  }
}

function parseFrontmatterValue(value: string): FrontmatterValue {
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean)
  }

  return value.replace(/^['"]|['"]$/g, '')
}

function normalizeCategory(value: FrontmatterValue | undefined): WriteupCategory {
  const category = String(value ?? 'Misc')

  if (WRITEUP_CATEGORIES.includes(category as WriteupCategory)) {
    return category as WriteupCategory
  }

  return 'Misc'
}

function normalizeTags(value: FrontmatterValue | undefined): string[] {
  if (Array.isArray(value)) {
    return value
  }

  if (!value) {
    return []
  }

  return String(value)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export const writeups = Object.entries(modules)
  .map(([filePath, raw]) => parseFrontmatter(raw, filePath))
  .sort((left, right) => right.date.localeCompare(left.date))
