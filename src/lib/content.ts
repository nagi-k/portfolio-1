import yaml from 'js-yaml'

export interface Project {
  slug: string
  title: string
  year: string
  category: string
  cover: string
  excerpt: string
  tags: string[]
  role?: string
  client?: string
  featured: boolean
  hidden: boolean
  order: number
  customPage?: string
  body: string
}

export interface SiteInfo {
  name: string
  role: string
  tagline: string
  intro: string
  email: string
  location: string
  socials: { label: string; url: string }[]
}

export interface AboutInfo {
  portrait: string
  skills: { group: string; items: string }[]
  body: string
}

function parseFrontmatter<T>(raw: string): { data: T; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {} as T, body: raw }
  return { data: yaml.load(match[1]) as T, body: match[2].trim() }
}

/** 图片路径规整：兼容 /images/xx 与 images/xx，自动补 base */
export function resolveAsset(src: string): string {
  if (!src) return src
  if (/^(https?:)?\/\//.test(src)) return src
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return base + (src.startsWith('/') ? src : `/${src}`)
}

/* ---------- 作品 ---------- */
const projectFiles = import.meta.glob('/content/projects/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

type ProjectFrontmatter = Omit<Project, 'slug' | 'body'>

export const projects: Project[] = Object.entries(projectFiles)
  .map(([path, raw]) => {
    const { data, body } = parseFrontmatter<ProjectFrontmatter>(raw)
    const slug = path.split('/').pop()!.replace(/\.md$/, '')
    return { ...data, slug, body }
  })
  .filter((p) => !p.hidden)
  .sort((a, b) => a.order - b.order)

export const featuredProjects = projects.filter((p) => p.featured)

/** 固定分类展示顺序 */
export const categoryOrder = ['工业设计', 'HMI设计', '交互设计', 'UI设计', 'UX设计']

export const categories = categoryOrder.filter((c) => projects.some((p) => p.category === c))

export function projectsByCategory(category: string) {
  return projects.filter((p) => p.category === category)
}

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug)
}

/* ---------- 站点信息 / 关于 ---------- */
const pageFiles = import.meta.glob('/content/pages/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function getPage<T extends object>(name: string): T & { body: string } {
  const key = Object.keys(pageFiles).find((k) => k.endsWith(`/${name}.md`))
  if (!key) return { body: '' } as T & { body: string }
  const { data, body } = parseFrontmatter<T>(pageFiles[key])
  return { ...data, body }
}

export const site = getPage<SiteInfo>('site')
export const about = getPage<AboutInfo>('about')
