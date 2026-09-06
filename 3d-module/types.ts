export interface Homepage3DModel {
  title: string
  glbUrl: string
  thumbnail?: string
}

export interface GlbViewerProps {
  glbUrl: string
  className?: string
  aspect?: 'video' | 'square' | 'auto'
  onLoad?: () => void
  onError?: (err: Error) => void
}
