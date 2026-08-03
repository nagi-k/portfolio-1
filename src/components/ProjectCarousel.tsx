import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Project } from '../lib/content'
import { resolveAsset } from '../lib/content'

interface Props {
  projects: Project[]
}

export default function ProjectCarousel({ projects }: Props) {
  const [current, setCurrent] = useState(0)
  const total = projects.length

  useEffect(() => {
    if (total <= 1) return
    const timer = setInterval(() => {
      setCurrent((i) => (i + 1) % total)
    }, 6000)
    return () => clearInterval(timer)
  }, [total])

  if (total === 0) return null

  const go = (index: number) => setCurrent((index + total) % total)

  return (
    <div className="relative w-full overflow-hidden bg-ink">
      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {projects.map((p) => (
          <div key={p.slug} className="relative w-full flex-shrink-0">
            <Link to={`/works/${p.slug}`} className="group block">
              <div className="relative aspect-[16/10] md:aspect-[21/9]">
                <img
                  src={resolveAsset(p.cover)}
                  alt={p.title}
                  className="h-full w-full object-cover opacity-90 transition-opacity duration-700 group-hover:opacity-100"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />

                {/* Caption */}
                <div className="absolute bottom-0 left-0 w-full p-6 text-white md:p-12">
                  <div className="container-site">
                    <p className="font-en text-xs uppercase tracking-widest text-white/60">
                      {p.category} · {p.year}
                    </p>
                    <h3 className="mt-3 text-2xl font-light tracking-tight md:text-4xl">
                      {p.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-sm text-white/70 md:text-base">
                      {p.excerpt}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm text-white/80 transition-colors group-hover:text-white">
                      查看项目 <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Controls */}
      {total > 1 && (
        <>
          <button
            onClick={() => go(current - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-ink/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-ink/60 md:left-8"
            aria-label="上一个"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(current + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-ink/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-ink/60 md:right-8"
            aria-label="下一个"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-6 right-6 flex gap-2 md:bottom-12 md:right-12">
            {projects.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`跳转到第 ${i + 1} 张`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
