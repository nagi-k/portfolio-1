import { Link, Navigate, useParams } from 'react-router-dom'
import Markdown from '../components/Markdown'
import Reveal from '../components/Reveal'
import { getProject, projects, resolveAsset } from '../lib/content'

export default function WorkDetail() {
  const { slug } = useParams()
  const project = slug ? getProject(slug) : undefined

  if (!project) return <Navigate to="/works" replace />

  const idx = projects.findIndex((p) => p.slug === project.slug)
  const prev = projects[idx - 1]
  const next = projects[idx + 1]

  return (
    <article>
      {/* 头部信息 */}
      <header className="container-site py-16 md:py-24">
        <Reveal>
          <Link to="/works" className="text-sm text-ink-mute transition-colors hover:text-accent">
            ← 全部作品
          </Link>
        </Reveal>
        <Reveal delay={60}>
          <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <h1 className="text-3xl font-light md:text-5xl">{project.title}</h1>
            <span className="font-en text-sm text-ink-mute">{project.year}</span>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
            {project.excerpt}
          </p>
        </Reveal>
        <Reveal delay={160}>
          <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-6 border-t border-line pt-8 text-sm md:grid-cols-4">
            <div>
              <dt className="text-xs text-ink-mute">类别</dt>
              <dd className="mt-1.5">{project.category}</dd>
            </div>
            {project.role && (
              <div>
                <dt className="text-xs text-ink-mute">角色</dt>
                <dd className="mt-1.5">{project.role}</dd>
              </div>
            )}
            {project.client && (
              <div>
                <dt className="text-xs text-ink-mute">客户 / 背景</dt>
                <dd className="mt-1.5">{project.client}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-ink-mute">标签</dt>
              <dd className="mt-1.5">{project.tags.join(' / ')}</dd>
            </div>
          </dl>
        </Reveal>
      </header>

      {/* 封面大图 */}
      <Reveal>
        <div className="container-site">
          <img
            src={resolveAsset(project.cover)}
            alt={project.title}
            className="w-full bg-line object-cover"
          />
        </div>
      </Reveal>

      {/* 正文：背景 / 问题 / 过程 / 成果（Markdown） */}
      <div className="container-site py-16 md:py-24">
        <Reveal>
          <div className="mx-auto max-w-2xl">
            <Markdown text={project.body} />
          </div>
        </Reveal>
      </div>

      {/* 上 / 下项目导航 */}
      <nav className="border-t border-line">
        <div className="container-site grid md:grid-cols-2">
          {prev ? (
            <Link
              to={`/works/${prev.slug}`}
              className="group border-b border-line py-10 md:border-b-0 md:border-r md:pr-8"
            >
              <p className="section-label">← 上一个项目</p>
              <p className="mt-3 text-lg transition-colors group-hover:text-accent">{prev.title}</p>
            </Link>
          ) : (
            <div className="hidden md:block" />
          )}
          {next ? (
            <Link to={`/works/${next.slug}`} className="group py-10 text-right md:pl-8">
              <p className="section-label">下一个项目 →</p>
              <p className="mt-3 text-lg transition-colors group-hover:text-accent">{next.title}</p>
            </Link>
          ) : (
            <div className="hidden md:block" />
          )}
        </div>
      </nav>
    </article>
  )
}
