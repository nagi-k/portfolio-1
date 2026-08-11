import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

interface GlbViewerProps {
  glbUrl: string
  className?: string
  aspect?: 'video' | 'square' | 'auto'
  onLoad?: () => void
  onError?: (err: Error) => void
}

export default function GlbViewer({
  glbUrl,
  className = '',
  aspect = 'video',
  onLoad,
  onError,
}: GlbViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !glbUrl) return

    const canvas = canvasRef.current
    const wrap = containerRef.current
    let disposed = false

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x3a3a3a)

    const camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / wrap.clientHeight, 0.01, 1000)

    let renderer: THREE.WebGLRenderer | null = null
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    } catch (e) {
      setError('当前浏览器/环境不支持 WebGL')
      setLoading(false)
      return
    }
    renderer.setSize(wrap.clientWidth, wrap.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    const roomEnv = new RoomEnvironment()
    scene.environment = pmremGenerator.fromScene(roomEnv, 0.15).texture

    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 1.5
    controls.maxDistance = 8
    controls.maxPolarAngle = Math.PI / 1.8
    controls.target.set(0, 0.3, 0)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888888, 1.2)
    hemiLight.position.set(0, 5, 0)
    scene.add(hemiLight)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const spotLight = new THREE.SpotLight(0xffffff, 30)
    spotLight.position.set(4, 6, 4)
    spotLight.angle = Math.PI / 4
    spotLight.penumbra = 0.4
    spotLight.castShadow = true
    scene.add(spotLight)

    const fillLight = new THREE.PointLight(0xcceeff, 4, 12)
    fillLight.position.set(-2, 1.5, 2)
    scene.add(fillLight)

    const groundGeo = new THREE.PlaneGeometry(20, 20)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x505050,
      roughness: 0.8,
      metalness: 0.1,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.8
    ground.receiveShadow = true
    scene.add(ground)

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/')
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)

    let currentModel: THREE.Object3D | null = null

    loader.load(
      glbUrl,
      (gltf) => {
        if (disposed) return
        const model = gltf.scene
        model.traverse((child) => {
          const mesh = child as THREE.Mesh
          if (mesh.isMesh) {
            const mat = mesh.material as THREE.MeshStandardMaterial
            if (mat) mat.envMapIntensity = 1.2
            mesh.castShadow = true
            mesh.receiveShadow = true
          }
        })

        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 2 / maxDim
        model.scale.setScalar(scale)
        model.position.sub(center.multiplyScalar(scale))

        if (currentModel) scene.remove(currentModel)
        scene.add(model)
        currentModel = model

        const dist = maxDim * scale * 2.5
        camera.position.set(dist * 0.8, dist * 0.5, dist)
        controls.target.set(0, 0, 0)
        controls.update()

        setLoading(false)
        setError('')
        onLoad?.()
      },
      (xhr) => {
        const p = xhr.loaded / (xhr.total || 1)
        setProgress(Math.round(p * 100))
      },
      (err) => {
        if (disposed) return
        const message = err instanceof Error ? err.message : String(err)
        setError('模型加载失败：' + message)
        setLoading(false)
        onError?.(err instanceof Error ? err : new Error(message))
      }
    )

    const resizeObserver = new ResizeObserver(() => {
      if (!renderer || !wrap) return
      const width = wrap.clientWidth
      const height = wrap.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    })
    resizeObserver.observe(wrap)

    let raf = 0
    const animate = () => {
      if (disposed) return
      raf = requestAnimationFrame(animate)
      controls.update()
      renderer!.render(scene, camera)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      dracoLoader.dispose()
      controls.dispose()
      if (currentModel) {
        currentModel.traverse((child) => {
          const mesh = child as THREE.Mesh
          if (mesh.isMesh) {
            mesh.geometry.dispose()
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            mats.forEach((m) => m?.dispose())
          }
        })
      }
      groundGeo.dispose()
      groundMat.dispose()
      renderer?.dispose()
    }
  }, [glbUrl, onLoad, onError])

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden rounded-xl bg-[#3a3a3a] ${className}`}>
      <div className={aspect === 'auto' ? 'h-full w-full' : 'relative w-full'} style={aspect === 'auto' ? undefined : { paddingBottom: aspect === 'video' ? '56.25%' : '100%' }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block h-full w-full cursor-move"
        />
      </div>

      {loading && !error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-400" />
          <div className="text-sm tracking-wide text-white/50">Loading 3D Scene…</div>
          <div className="h-0.5 w-60 overflow-hidden rounded bg-white/10">
            <div
              className="h-full bg-cyan-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
          <p className="text-sm text-white/70">{error}</p>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-xs text-white/60 backdrop-blur">
        左键旋转 · 滚轮缩放 · 右键平移
      </div>
    </div>
  )
}
