import { marked } from 'marked'
import { useMemo } from 'react'
import { resolveAsset } from '../lib/content'

marked.setOptions({ breaks: true, gfm: true })

export default function Markdown({ text }: { text: string }) {
  const html = useMemo(() => {
    const raw = marked.parse(text) as string
    // 正文中的相对图片路径补 base
    return raw.replace(/src="\/?(images\/[^"]+)"/g, (_m, p) => `src="${resolveAsset(p)}"`)
  }, [text])
  return <div className="prose-body" dangerouslySetInnerHTML={{ __html: html }} />
}
