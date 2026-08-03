import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import ProjectCarousel from '../components/ProjectCarousel'
import Reveal from '../components/Reveal'
import { categories, featuredProjects, projects, projectsByCategory, site } from '../lib/content'
import { resolveAsset } from '../lib/content'

function CategorySection({ category }: { category: string }) {
  const items = projectsByCategory(category)
  if (items.length === 0) return null

  return (
    <section className="border-t border-line bg-white py-14 md:py-24">
      <div className="container-site">
        <Reveal>
          <div className="mb-6 flex items-end justify-between md:mb-10">
            <div>
              <p className="section-label">{String(items.length).padStart(2, '0')} Projects</p>
              <h2 className="mt-2 text-xl font-light md:text-3xl">{category}</h2>
            </div>
            <Link
              to="/works"
              className="group hidden items-center gap-1 text-sm text-ink-mute transition-colors hover:text-accent md:flex"
            >
              查看全部
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        {/* 横向滚动卡片 */}
        <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 md:-mx-8 md:gap-6 md:px-8">
          {items.map((p, i) => (
            <Reveal key={p.slug} delay={i * 80} className="snap-start">
              <Link
                to={`/works/${p.slug}`}
                className="group relative block w-[82vw] flex-shrink-0 overflow-hidden bg-paper sm:w-[64vw] md:w-[32rem]"
              >
                <div className="overflow-hidden bg-line">
                  <img
                    src={resolveAsset(p.cover)}
                    alt={p.title}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>

                <div className="mt-4 flex items-start justify-between pr-2">
                  <div>
                    <h3 className="text-base font-normal transition-colors group-hover:text-accent md:text-lg">
                      {p.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-mute">{p.excerpt}</p>
                  </div>
                  <span className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-line opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 md:h-8 md:w-8">
                    <ArrowUpRight className="h-3.5 w-3.5 text-ink-mute md:h-4 md:w-4" />
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs text-ink-mute">
                  <span className="font-en">{p.year}</span>
                  <span className="h-px w-4 bg-line" />
                  <span>{p.category}</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <div>
      {/* Hero：轮播图背景 + 个人定位/介绍叠加 */}
      <section className="relative min-h-[85vh] overflow-hidden bg-ink md:min-h-[92vh]">
        {/* 轮播背景 */}
        <div className="absolute inset-0 z-0">
          <ProjectCarousel projects={featuredProjects} variant="hero" />
        </div>

        {/* 顶部暗色渐变，保证左上角文字可读 */}
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-ink/80 via-ink/30 to-transparent md:from-ink/70 md:via-ink/20" />

        {/* Hero 文字 */}
        <div className="container-site pointer-events-none relative z-10 flex min-h-[85vh] flex-col justify-between pb-8 pt-20 md:min-h-[92vh] md:pb-14 md:pt-32">
          <div className="pointer-events-auto">
            <Reveal>
              <p className="section-label text-white/70">{site.role || 'Industrial / Interaction Designer'}</p>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-4 max-w-3xl text-2xl font-light leading-[1.35] tracking-tight text-white md:mt-6 md:text-5xl md:leading-[1.22]">
                {site.tagline}
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 md:mt-6 md:text-[15px]">
                {site.intro}
              </p>
            </Reveal>
            <Reveal delay={220}>
              <div className="mt-6 flex flex-col items-start gap-3 md:mt-10 md:flex-row md:items-center md:gap-5">
                <Link
                  to="/works"
                  className="group inline-flex items-center gap-2 border border-white/40 bg-white/10 px-5 py-2.5 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-ink md:px-6 md:py-3"
                >
                  查看作品
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  to="/about"
                  className="group inline-flex items-center gap-2 border border-white/40 bg-white/10 px-5 py-2.5 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-ink md:px-6 md:py-3"
                >
                  关于我
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link to="/contact" className="text-sm text-white/70 transition-colors hover:text-white">
                  联系我
                </Link>
              </div>
            </Reveal>
          </div>

          {/* 底部滚动提示 */}
          <Reveal delay={300} className="pointer-events-auto">
            <div className="hidden items-center gap-3 text-xs text-white/50 md:flex">
              <span className="font-en uppercase tracking-widest">Scroll</span>
              <span className="h-px w-8 bg-white/30" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 分类快速入口 */}
      <section className="border-b border-line bg-white">
        <div className="container-site py-6 md:py-8">
          <Reveal>
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <span className="mr-1 text-xs text-ink-mute md:mr-2">按领域浏览</span>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  to="/works"
                  className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs text-ink transition-all hover:border-accent hover:bg-accent hover:text-white md:px-4 md:py-2 md:text-sm"
                >
                  {cat}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 md:h-3.5 md:w-3.5" />
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 四大分类作品展示 */}
      {categories.map((cat) => (
        <CategorySection key={cat} category={cat} />
      ))}

      {/* 项目索引 */}
      <section className="container-site py-16 md:py-28">
        <Reveal>
          <p className="section-label mb-8 md:mb-10">Index</p>
        </Reveal>
        <div>
          {projects.map((p, i) => (
            <Reveal key={p.slug} delay={i * 40}>
              <Link
                to={`/works/${p.slug}`}
                className="group grid grid-cols-[1fr_auto] items-baseline gap-3 border-t border-line py-4 transition-colors last:border-b hover:bg-white md:grid-cols-[3rem_1fr_10rem_6rem] md:gap-8 md:px-2 md:py-5"
              >
                <span className="hidden font-en text-xs text-ink-mute md:block">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-sm transition-colors group-hover:text-accent md:text-lg">
                  {p.title}
                </span>
                <span className="hidden text-sm text-ink-mute md:block">{p.category}</span>
                <span className="text-right font-en text-xs text-ink-mute">{p.year}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  )
}
