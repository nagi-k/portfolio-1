import Reveal from '../components/Reveal'
import { site } from '../lib/content'

export default function Contact() {
  return (
    <div className="container-site flex min-h-[70vh] flex-col justify-center py-20 md:py-24">
      <Reveal>
        <p className="section-label">Contact</p>
      </Reveal>
      <Reveal delay={80}>
        <h1 className="mt-5 max-w-2xl text-2xl font-light leading-snug md:mt-6 md:text-5xl md:leading-tight">
          有项目想聊聊？
          <br />
          随时给我写信。
        </h1>
      </Reveal>
      <Reveal delay={160}>
        <a
          href={`mailto:${site.email}`}
          className="mt-8 inline-block font-en text-lg text-accent underline decoration-accent/30 underline-offset-8 transition-colors hover:decoration-accent md:mt-10 md:text-2xl"
        >
          {site.email}
        </a>
      </Reveal>
      <Reveal delay={220}>
        <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 md:mt-14">
          {(site.socials || []).map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-ink-mute transition-colors hover:text-accent"
            >
              {s.label} ↗
            </a>
          ))}
        </div>
      </Reveal>
    </div>
  )
}
