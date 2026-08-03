import Markdown from '../components/Markdown'
import Reveal from '../components/Reveal'
import { about, site, resolveAsset } from '../lib/content'

export default function About() {
  return (
    <div className="container-site py-16 md:py-24">
      <Reveal>
        <p className="section-label">About</p>
        <h1 className="mt-3 text-3xl font-light md:text-4xl">关于我</h1>
      </Reveal>

      <div className="mt-14 grid gap-14 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-20">
        {/* 左：肖像 + 联系 */}
        <Reveal>
          <div>
            {about.portrait && (
              <img
                src={resolveAsset(about.portrait)}
                alt={site.name}
                className="aspect-[4/5] w-full bg-line object-cover"
              />
            )}
            <div className="mt-8 space-y-2 text-sm">
              <p className="text-ink-mute">{site.location}</p>
              <a
                href={`mailto:${site.email}`}
                className="block font-en transition-colors hover:text-accent"
              >
                {site.email}
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {(site.socials || []).map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-ink-soft underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </Reveal>

        {/* 右：简介 + 技能 */}
        <div>
          <Reveal delay={80}>
            <div className="max-w-xl">
              <Markdown text={about.body} />
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="mt-16 border-t border-line pt-10">
              <p className="section-label mb-8">Capabilities</p>
              <div className="grid gap-8 sm:grid-cols-2">
                {(about.skills || []).map((g) => (
                  <div key={g.group}>
                    <h3 className="text-sm font-medium">{g.group}</h3>
                    <p className="mt-3 text-sm leading-7 text-ink-soft">{g.items}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
