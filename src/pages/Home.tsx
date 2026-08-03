import { Link } from 'react-router-dom'
import ProjectCarousel from '../components/ProjectCarousel'
import Reveal from '../components/Reveal'
import { featuredProjects, projects, site } from '../lib/content'

export default function Home() {
  return (
    <div>
      {/* Hero：轮播图背景 + 个人定位/介绍叠加 */}
      <section className="relative min-h-[92vh] overflow-hidden bg-ink">
        {/* 轮播背景 */}
        <div className="absolute inset-0">
          <ProjectCarousel projects={featuredProjects} variant="hero" />
        </div>

        {/* 顶部暗色渐变，保证左上角文字可读 */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/20 to-transparent" />

        {/* Hero 文字 */}
        <div className="container-site relative z-10 flex min-h-[92vh] flex-col justify-between pb-10 pt-24 md:pb-14 md:pt-32">
          <div>
            <Reveal>
              <p className="section-label text-white/70">{site.role || 'Industrial / Interaction Designer'}</p>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-5 max-w-3xl text-3xl font-light leading-[1.3] tracking-tight text-white md:mt-6 md:text-5xl md:leading-[1.22]">
                {site.tagline}
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-white/75 md:mt-6 md:text-[15px]">
                {site.intro}
              </p>
            </Reveal>
            <Reveal delay={220}>
              <div className="mt-8 flex items-center gap-5 md:mt-10">
                <Link
                  to="/works"
                  className="group inline-flex items-center gap-2 border border-white/40 bg-white/10 px-6 py-3 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-ink"
                >
                  查看作品
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link to="/contact" className="text-sm text-white/70 transition-colors hover:text-white">
                  联系我
                </Link>
              </div>
            </Reveal>
          </div>

          {/* 底部滚动提示 */}
          <Reveal delay={300}>
            <div className="hidden items-center gap-3 text-xs text-white/50 md:flex">
              <span className="font-en uppercase tracking-widest">Scroll</span>
              <span className="h-px w-8 bg-white/30" />
            </div>
          </Reveal>
        </div>
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
