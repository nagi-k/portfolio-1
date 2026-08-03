import { useState } from 'react'

interface Props {
  src: string
  alt: string
  className?: string
  aspect?: string
  priority?: boolean
}

export default function OptimizedImage({ src, alt, className = '', aspect, priority = false }: Props) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={`relative overflow-hidden bg-line ${aspect || ''}`}>
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'auto' : 'async'}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      />
    </div>
  )
}
