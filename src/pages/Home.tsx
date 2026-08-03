import { Link } from 'react-router-dom'
import ProjectCarousel from '../components/ProjectCarousel'
import Reveal from '../components/Reveal'
import { featuredProjects, projects, site } from '../lib/content'

export default function Home() {
  return (
    <div>
      {/* Hero：个人定位 + 一句话介绍 */}
      <section className="container-site pb-24 pt-24 md:pb-36 md:pt-40">
        <Reveal>
          <p className="section-label">{site.role || 'Industrial / Interaction Designer'}</p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-6 max-w-3xl text-4xl font-light leading-[1.25] tracking-tight md:text-6xl md:leading-[1.18]">
            {site.tagline}
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-ink-soft">{site.intro}</p>
        </Reveal>
        <Reveal delay={220}>
          <div className="mt-12 flex items-center gap-6">
            <Link
              to="/works"
              className="group inline-flex items-center gap-2 border border-ink px-6 py-3 text-sm transition-colors hover:bg-ink hover:text-paper"
            >
              查看作品
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link to="/contact" className="text-sm text-ink-mute transition-colors hover:text-accent">
              联系我
            </Link>
          </div>
        </Reveal>
      </section>

      {/* 精选作品轮播 */}
      <section className="border-t border-line">
        <div className="container-site py-12 md:py-16">
          <Reveal>
            <div className="mb-8 flex items-end justify-between md:mb-10">
              <div>
                <p className="section-label">Selected Works</p>
                <h2 className="mt-3 text-2xl font-light md:text-3xl">精选作品</h2>
              </div>
              <Link
                to="/works"
                className="hidden text-sm text-ink-mute transition-colors hover:text-accent md:block"
              >
                全部作品 →
              </Link>
            </div>
          </Reveal>
        </div>

        <ProjectCarousel projects={featuredProjects} />
      </section>

      {/* 项目索引 */}
      <section className="container-site py-20 md:py-28">
        <Reveal>
          <p className="section-label mb-10">Index</p>
        </Reveal>
        <div>
          {projects.map((p, i) => (
            <Reveal key={p.slug} delay={i * 40}>
              <Link
                to={`/works/${p.slug}`}
                className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-4 border-t border-line py-5 transition-colors last:border-b hover:bg-white md:grid-cols-[3rem_1fr_10rem_6rem] md:gap-8 md:px-2"
              >
                <span className="font-en text-xs text-ink-mute">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-base transition-colors group-hover:text-accent md:text-lg">
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
