import Reveal from '../components/Reveal'
import { site } from '../lib/content'

export default function Contact() {
  return (
    <div className="container-site flex min-h-[70vh] flex-col justify-center py-24">
      <Reveal>
        <p className="section-label">Contact</p>
      </Reveal>
      <Reveal delay={80}>
        <h1 className="mt-6 max-w-2xl text-3xl font-light leading-snug md:text-5xl md:leading-tight">
          有项目想聊聊？
          <br />
          随时给我写信。
        </h1>
      </Reveal>
      <Reveal delay={160}>
        <a
          href={`mailto:${site.email}`}
          className="mt-10 inline-block font-en text-xl text-accent underline decoration-accent/30 underline-offset-8 transition-colors hover:decoration-accent md:text-2xl"
        >
          {site.email}
        </a>
      </Reveal>
      <Reveal delay={220}>
        <div className="mt-14 flex flex-wrap gap-x-6 gap-y-2">
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
