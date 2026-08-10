import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import type { Project } from '../lib/content'
import { categories, projects, resolveAsset } from '../lib/content'

function ProjectCard({ p }: { p: Project }) {
  const content = (
    <>
      <div className="overflow-hidden bg-line">
        <img
          src={resolveAsset(p.cover)}
          alt={p.title}
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-4 flex items-baseline justify-between md:mt-5">
        <h2 className="text-sm font-normal transition-colors group-hover:text-accent md:text-base">
          {p.title}
        </h2>
        <span className="font-en text-xs text-ink-mute">{p.year}</span>
      </div>
      <p className="mt-1 text-sm text-ink-mute">{p.category}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.excerpt}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {p.tags.map((t) => (
          <span key={t} className="bg-white px-2 py-0.5 text-xs text-ink-mute">
            {t}
          </span>
        ))}
      </div>
    </>
  )

  if (p.customPage) {
    return (
      <a href={p.customPage} className="group block">
        {content}
      </a>
    )
  }

  return (
    <Link to={`/works/${p.slug}`} className="group block">
      {content}
    </Link>
  )
}

export default function Works() {
  const [active, setActive] = useState('全部')
  const list = useMemo(
    () => (active === '全部' ? projects : projects.filter((p) => p.category === active)),
    [active],
  )

  return (
    <div className="container-site py-14 md:py-24">
      <Reveal>
        <p className="section-label">Works</p>
        <h1 className="mt-3 text-2xl font-light md:text-4xl">全部作品</h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft md:text-[15px]">
          从真实问题出发，以研究驱动设计推导，呈现从洞察到落地的完整过程。
        </p>
      </Reveal>

      {/* 分类筛选 */}
      <Reveal delay={80}>
        <div className="mt-8 flex flex-wrap gap-2 md:mt-10">
          {['全部', ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`border px-3 py-1.5 text-xs transition-colors md:px-4 md:text-sm ${
                active === c
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line text-ink-mute hover:border-ink hover:text-ink'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Reveal>

      {/* 作品网格 */}
      <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 md:mt-14 md:gap-x-8 md:gap-y-16">
        {list.map((p, i) => (
          <Reveal key={p.slug} delay={(i % 3) * 60}>
            <ProjectCard p={p} />
          </Reveal>
        ))}
      </div>

      {list.length === 0 && (
        <p className="mt-20 text-center text-sm text-ink-mute">该分类下暂无作品</p>
      )}
    </div>
  )
}
