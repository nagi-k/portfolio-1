import { marked } from 'marked'
import { useMemo } from 'react'
import { resolveAsset } from '../lib/content'

marked.setOptions({ breaks: true, gfm: true })

export default function Markdown({ text }: { text: string }) {
  const html = useMemo(() => {
    const raw = marked.parse(text) as string
    // 正文中的相对图片路径补 base，并加上懒加载
    return raw
      .replace(/src="\/?(images\/[^"]+)"/g, (_m, p) => `src="${resolveAsset(p)}"`)
      .replace(/<img([^>]+)>/g, (_m, attrs) => {
        if (attrs.includes('loading=')) return _m
        return `<img${attrs} loading="lazy" decoding="async">`
      })
  }, [text])
  return <div className="prose-body" dangerouslySetInnerHTML={{ __html: html }} />
}
