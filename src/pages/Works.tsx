import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import { categories, projects, resolveAsset } from '../lib/content'

export default function Works() {
  const [active, setActive] = useState('全部')
  const list = useMemo(
    () => (active === '全部' ? projects : projects.filter((p) => p.category === active)),
    [active],
  )

  return (
    <div className="container-site py-16 md:py-24">
      <Reveal>
        <p className="section-label">Works</p>
        <h1 className="mt-3 text-3xl font-light md:text-4xl">全部作品</h1>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft">
          从真实问题出发，以研究驱动设计推导，呈现从洞察到落地的完整过程。
        </p>
      </Reveal>

      {/* 分类筛选 */}
      <Reveal delay={80}>
        <div className="mt-10 flex flex-wrap gap-2">
          {['全部', ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`border px-4 py-1.5 text-sm transition-colors ${
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
      <div className="mt-14 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => (
          <Reveal key={p.slug} delay={(i % 3) * 60}>
            <Link to={`/works/${p.slug}`} className="group block">
              <div className="overflow-hidden bg-line">
                <img
                  src={resolveAsset(p.cover)}
                  alt={p.title}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>
              <div className="mt-5 flex items-baseline justify-between">
                <h2 className="text-base font-normal transition-colors group-hover:text-accent">
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
            </Link>
          </Reveal>
        ))}
      </div>

      {list.length === 0 && (
        <p className="mt-20 text-center text-sm text-ink-mute">该分类下暂无作品</p>
      )}
    </div>
  )
}
