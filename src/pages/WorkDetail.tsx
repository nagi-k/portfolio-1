import { lazy, Suspense, useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Markdown from '../components/Markdown'
import Reveal from '../components/Reveal'
import { getProject, projects, resolveAsset } from '../lib/content'

const GlbViewer = lazy(() => import('../components/GlbViewer'))

export default function WorkDetail() {
  const { slug } = useParams()
  const project = slug ? getProject(slug) : undefined

  useEffect(() => {
    if (project?.customPage) {
      window.location.href = project.customPage
    }
  }, [project])

  if (!project) return <Navigate to="/works" replace />

  if (project.customPage) {
    return (
      <div className="container-site flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <p className="text-ink-mute">正在前往项目详情页…</p>
        <a
          href={project.customPage}
          className="mt-4 text-accent underline decoration-accent/30 underline-offset-8"
        >
          如果没有自动跳转，请点这里
        </a>
      </div>
    )
  }

  const idx = projects.findIndex((p) => p.slug === project.slug)
  const prev = projects[idx - 1]
  const next = projects[idx + 1]

  return (
    <article>
      {/* 头部信息 */}
      <header className="container-site py-14 md:py-24">
        <Reveal>
          <Link to="/works" className="text-sm text-ink-mute transition-colors hover:text-accent">
            ← 全部作品
          </Link>
        </Reveal>
        <Reveal delay={60}>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2 md:mt-8">
            <h1 className="text-2xl font-light md:text-5xl">{project.title}</h1>
            <span className="font-en text-sm text-ink-mute">{project.year}</span>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-soft md:mt-6 md:text-[15px]">
            {project.excerpt}
          </p>
        </Reveal>
        <Reveal delay={160}>
          <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-5 border-t border-line pt-7 text-sm md:mt-10 md:gap-6 md:pt-8 md:grid-cols-4">
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
            loading="eager"
            decoding="async"
            className="max-h-[70vh] w-full bg-line object-contain md:max-h-[80vh]"
          />
        </div>
      </Reveal>

      {/* 工业设计作品 3D 预览 */}
      {project.category === '工业设计' && project.glbModelUrl && (
        <section className="container-site pb-14 md:pb-24">
          <Reveal>
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="section-label">3D Preview</p>
                <h2 className="mt-2 text-xl font-light md:text-2xl">三维模型预览</h2>
              </div>
            </div>
            <Suspense fallback={<div className="flex aspect-video w-full items-center justify-center rounded-xl bg-[#3a3a3a] text-sm text-white/50">3D 引擎加载中…</div>}>
              <GlbViewer glbUrl={resolveAsset(project.glbModelUrl)} aspect="video" />
            </Suspense>
          </Reveal>
        </section>
      )}

      {/* 正文：背景 / 问题 / 过程 / 成果（Markdown） */}
      <div className="container-site py-14 md:py-24">
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
