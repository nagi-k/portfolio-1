import { lazy, Suspense, useState } from 'react'
import type { Homepage3DModel } from './types'

const GlbViewer = lazy(() => import('./GlbViewer'))

interface Homepage3DViewerProps {
  models: Homepage3DModel[]
  title?: string
  subtitle?: string
  resolveUrl?: (src: string) => string
}

export default function Homepage3DViewer({
  models,
  title = '工业设计 · 精选模型',
  subtitle = 'Featured 3D',
  resolveUrl = (src) => src,
}: Homepage3DViewerProps) {
  const validModels = models.filter((m) => m.glbUrl)
  const [active, setActive] = useState(0)

  if (validModels.length === 0) {
    return (
      <section className="bg-white py-14 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs uppercase tracking-widest text-gray-400">{subtitle}</p>
          <h2 className="mt-2 text-xl font-light md:text-3xl">{title}</h2>
          <div className="mt-6 flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center">
            <p className="text-sm text-gray-400">暂无 3D 模型</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white py-14 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-6 md:mb-10">
          <p className="text-xs uppercase tracking-widest text-gray-400">{subtitle}</p>
          <h2 className="mt-2 text-xl font-light md:text-3xl">{title}</h2>
        </div>

        <Suspense
          fallback={
            <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-[#3a3a3a] text-sm text-white/50">
              3D 引擎加载中…
            </div>
          }
        >
          <GlbViewer glbUrl={resolveUrl(validModels[active].glbUrl)} aspect="video" />
        </Suspense>

        <div className="mt-6 flex flex-wrap gap-3">
          {validModels.map((m, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`rounded-full border px-4 py-2 text-sm transition-all md:px-5 md:py-2.5 ${
                active === i
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-blue-600 hover:text-blue-600'
              }`}
            >
              {m.title || `模型 ${i + 1}`}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
