import data from '../../content/data.json'

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

export interface ContentData {
  projects: Project[]
  site: SiteInfo
  about: AboutInfo
}

const typedData = data as ContentData

/** 图片路径规整：兼容 /images/xx 与 images/xx，自动补 base */
export function resolveAsset(src: string): string {
  if (!src) return src
  if (/^(https?:)?\/\//.test(src)) return src
  const base = import.meta.env.BASE_URL.replace(/\/$$/, '')
  return base + (src.startsWith('/') ? src : `/$${src}`)
}

/* ---------- 作品 ---------- */
export const projects: Project[] = typedData.projects
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
export const site = typedData.site
export const about = typedData.about
