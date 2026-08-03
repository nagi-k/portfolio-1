# 个人作品集网站

工业设计 / 交互设计作品集。React + Vite + TypeScript + Tailwind CSS 前台，Decap CMS 后台管理，GitHub Actions 自动部署到 GitHub Pages。

## 本地开发

```bash
npm install
npm run dev        # http://localhost:5173
```

构建与预览：

```bash
npm run build      # 输出到 dist/
npm run preview
```

## 目录结构

```
content/            # 网站内容（Markdown，CMS 编辑的就是这里）
  projects/         # 作品，一个文件一个项目
  pages/            # 站点信息、关于我
public/
  admin/            # Decap CMS 后台（/admin 访问）
  images/           # 图片（uploads/ 为 CMS 上传目录）
src/                # React 前端代码
.github/workflows/  # 自动部署
```

## 部署到 GitHub Pages

1. 在 GitHub 新建公开仓库（如 `portfolio`），把本项目推送到 `main` 分支。
2. 仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。
3. 推送后 Actions 自动构建部署，站点地址为 `https://<用户名>.github.io/<仓库名>/`（工作流已自动适配子路径）。

## 后台登录配置（一次性）

后台地址：`https://<用户名>.github.io/<仓库名>/admin`，通过 GitHub OAuth 登录，只有仓库协作者能编辑。Decap CMS 的 GitHub 登录需要一个 OAuth 回调服务，最省事的做法是借用 Netlify（免费，不需要真的托管网站）：

1. **GitHub 创建 OAuth App**：Settings → Developer settings → OAuth Apps → New OAuth App
   - Homepage URL：`https://api.netlify.com`
   - Authorization callback URL：`https://api.netlify.com/auth/done`
   - 记下 **Client ID**，并生成 **Client Secret**
2. **Netlify 配置**：注册登录 [app.netlify.com](https://app.netlify.com)，新建任意一个站点（Add new site → Deploy manually，传个空文件夹即可，仅用于挂 OAuth）。进入该站点 **Site configuration → Access & security → OAuth → Authentication providers → Install provider**，选 GitHub，填入上面的 Client ID / Secret。
3. **修改配置**：编辑 [public/admin/config.yml](public/admin/config.yml)
   - `backend.repo` → `<你的用户名>/<仓库名>`
   - `base_url` 保持 `https://api.netlify.com` 即可
4. 推送后访问 `/admin`，点 Login with GitHub 授权即可使用。

> 本地免登录调试：仓库根目录运行 `npx decap-server`，再 `npm run dev`，访问 `http://localhost:5173/admin/` 即可直接编辑本地文件（config.yml 已开启 `local_backend`）。

## 后台使用说明

- **作品**：新增 / 编辑 / 删除项目；`首页精选` 控制是否出现在首页，`隐藏` 控制是否上线，`排序权重` 越小越靠前；正文支持 Markdown，可直接插入图片画廊。
- **页面内容**：修改姓名、定位、一句话介绍、邮箱、社交链接、肖像照、技能与简介。
- **保存即发布**：点 Publish 后 CMS 自动提交到 `main` 分支 → 触发 GitHub Actions → 几分钟后线上更新（可在仓库 Actions 页查看进度）。
- 上传的图片存放在 `public/images/uploads/`，建议只传网页展示用的压缩版本（宽 ≤2000px）。

## 内容安全建议

- 图片加水印或叠加个人 Logo；不上传原始高清源文件。
- 页脚已带版权声明（在「页面内容 → 站点信息」中修改）。
- 代码开源 ≠ 作品开源，设计内容的版权仍归你所有。

## 技术栈

React 18 · Vite 5 · TypeScript · Tailwind CSS 3 · Decap CMS 3 · GitHub Pages / Actions
