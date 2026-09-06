# 3D GLB 预览模块

包含一个基于 Three.js 的 GLB/GLTF 模型预览组件，以及一个带模型切换按钮的首页 3D 展示组件。

## 安装依赖

```bash
npm install three
npm install -D @types/three
```

React 项目还需要：
```bash
npm install react react-dom
```

## 文件清单

| 文件 | 说明 |
|------|------|
| `GlbViewer.tsx` | React GLB 预览组件，带环境光、金属反射、阴影、轨道控制器 |
| `Homepage3DViewer.tsx` | 首页 3D 展示组件，支持多模型切换 |
| `types.ts` | TypeScript 类型定义 |
| `plain-html/glb-viewer.html` | 纯 HTML 版本，无需 React |

## React 使用示例

### 单模型预览

```tsx
import GlbViewer from './3d-module/GlbViewer'

function App() {
  return <GlbViewer glbUrl="/models/example.glb" aspect="video" />
}
```

### 首页多模型切换

```tsx
import Homepage3DViewer from './3d-module/Homepage3DViewer'
import type { Homepage3DModel } from './3d-module/types'

const models: Homepage3DModel[] = [
  { title: '模型一', glbUrl: '/models/1.glb' },
  { title: '模型二', glbUrl: '/models/2.glb' },
  { title: '模型三', glbUrl: '/models/3.glb' },
]

function App() {
  return <Homepage3DViewer models={models} title="精选模型" subtitle="Featured 3D" />
}
```

### 使用 CDN 或自定义域名补全 URL

```tsx
<Homepage3DViewer
  models={models}
  resolveUrl={(src) =>
    src.startsWith('http') ? src : `https://your-cdn.com${src.startsWith('/') ? '' : '/'}${src}`
  }
/>
```

## 灯光说明

`GlbViewer` 内置了以下光源，适合展示金属/高反光材质：

- `RoomEnvironment` 环境贴图（PMREM 生成）
- `HemisphereLight` 半球光
- `AmbientLight` 环境光
- `DirectionalLight` 主光源 + 阴影
- `SpotLight` 聚光灯
- `PointLight` 补光
- `SpotLight` 轮廓光

如需调整亮度，修改 `GlbViewer.tsx` 中各光源的强度参数即可。

## 纯 HTML 版本

如果目标网站不是 React 项目，可以直接使用 `plain-html/glb-viewer.html`，用 `<script type="module">` 引入 Three.js。
