# Serendipity Music Player

> 一款基于 Next.js 15 的在线音乐播放器，采用黑胶唱片风格设计，支持音频可视化和动态主题色。

## 功能特性

- 🎵 **在线流式播放** - 支持边下边播，无需等待
- 💿 **黑胶唱片设计** - 3D 悬浮效果 + 旋转动画
- 🎨 **动态主题色** - 根据曲目自动生成独特渐变配色
- 📊 **音频可视化** - 实时频谱分析 + 环形可视化器
- ✨ **动态背景** - 随音乐低音节拍律动的飞行音符
- ❤️ **收藏功能** - localStorage 持久化收藏列表
- 🔀 **多种分组** - 默认/收藏两种播放分组
- 🔍 **快速搜索** - 按歌手名或歌曲名实时过滤
- 👤 **歌手列表** - 按歌手分类浏览，支持多歌手解析
- 📱 **响应式设计** - 完美适配移动端和桌面端
- ⚡ **高性能** - 虚拟化列表，流畅滚动体验

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15.3.6 (App Router + Turbopack) |
| 前端 | React 19 (函数组件 + Hooks) |
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS 4 + 自定义 CSS 动画 |
| 状态 | Zustand 5 |
| 虚拟化 | @tanstack/react-virtual |
| 字体 | Playfair Display + Plus Jakarta Sans + JetBrains Mono |
| 音频 | Web Audio API (音频分析 + 可视化) |
| 测试 | Vitest + React Testing Library |
| 部署 | Vercel |

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

### 生产构建

```bash
pnpm build
pnpm start
```

## 脚本命令

<!-- AUTO-GENERATED: scripts -->
| 命令 | 描述 |
|------|------|
| `pnpm dev` | 启动开发服务器 (Turbopack) |
| `pnpm build` | 生产环境构建 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | 运行 ESLint 检查 |
| `pnpm test` | 运行测试 (监听模式) |
| `pnpm test:run` | 运行测试 (单次) |
| `pnpm test:coverage` | 运行测试并生成覆盖率报告 |
<!-- /AUTO-GENERATED: scripts -->

## 项目结构

```
nextjs-music/
├── app/                    # Next.js App Router
│   ├── api/                # API 路由层
│   │   ├── res/            # GitHub 代理接口
│   │   ├── res2/           # jsDelivr CDN 代理接口
│   │   ├── playlist/       # 远程播放列表读取接口
│   │   └── admin/songs/    # 管理端上传接口
│   ├── admin/              # 上传管理页面
│   ├── components/         # UI 组件
│   │   ├── Player.tsx      # 核心播放器
│   │   ├── SongList.tsx    # 歌曲列表 (虚拟化)
│   │   ├── SingerList.tsx  # 歌手列表 (虚拟化)
│   │   ├── DynamicBackground.tsx  # 动态背景
│   │   └── ...
│   ├── hooks/              # 自定义 Hooks
│   │   ├── audio/          # 音频相关 Hooks
│   │   └── useThemeColor.ts # 主题色生成
│   ├── services/           # API 服务层
│   │   └── api/            # 音乐/歌词 API
│   ├── store/              # Zustand 状态管理
│   ├── utils/              # 工具函数
│   │   ├── singerParser.ts # 歌手名解析
│   │   └── performanceLogger.ts # 性能分析
│   ├── server/             # 服务端能力（GitHub Contents API）
│   └── page.tsx            # 主页面
├── public/
│   └── data.json           # 歌曲元数据
└── docs/                   # 项目文档
    └── DESIGN_ITERATION_PLAN.md  # 设计迭代计划
```

## API 接口

### GET /api/res

GitHub 代理接口，用于获取音乐文件。

**参数:**
- `name`: 音乐文件名 (需 URL 编码)
- `proxy`: 代理节点 (默认: `ghfast.top`)

### GET /api/res2

jsDelivr CDN 代理接口，用于移动端。

**参数:**
- `name`: 音乐文件名 (需双重 URL 编码)

### GET /api/playlist

读取 `dcdlove/oss` 仓库中的播放列表文件（默认 `music/data.json`），失败时回退到本地 `public/data.json`。

### POST /api/admin/songs

上传歌曲到 `dcdlove/oss` 并自动更新播放列表 JSON。

**请求方式**：`multipart/form-data`

**字段：**
- `file`：歌曲文件（仅支持 `.mp3`）
- `singer`：歌手名
- `title`：歌曲名
- `overwrite`：是否覆盖同名文件（可选，`true/false`）

**鉴权：**
- 请求头 `x-admin-token` 或 `Authorization: Bearer <token>`

## 环境变量

```bash
# 管理接口鉴权
ADMIN_TOKEN=your_admin_token

# GitHub 仓库写入（需要 repo contents 写权限）
GITHUB_TOKEN=github_pat_xxx
GITHUB_OWNER=dcdlove
GITHUB_REPO=oss
GITHUB_BRANCH=main
GITHUB_MUSIC_DIR=music
GITHUB_PLAYLIST_PATH=music/data.json

# 上传大小限制（MB）
# 建议线上 4（Vercel 免费版），本地可提高
MAX_UPLOAD_MB=4
```

## 管理端使用

启动项目后打开 `http://localhost:3000/admin`：
- 选择 mp3 文件后会自动从文件名提取“歌手-歌名”并填入表单（可手动修改）
- 提交后上传文件将统一写入为 `{歌手}-{歌名}.lkmp3`

## 设计风格

- **主题**: 深色 (深蓝紫渐变)
- **背景**: `linear-gradient(135deg, #0f172a, #1e1b4b, #312e81)`
- **玻璃态**: `backdrop-blur-xl` + `bg-white/10`
- **3D 效果**: `perspective` + `transform-style: preserve-3d`
- **字体**:
  - 标题: Playfair Display 900 (奢华复古感)
  - 正文: Plus Jakarta Sans (现代友好)
  - 等宽: JetBrains Mono (时间、编号)

## 音乐资源

- **存储位置**: GitHub 仓库 `dcdlove/oss` 的 `music/` 目录
- **访问方式**: jsDelivr CDN 或 GitHub 代理
- **命名规范**: `{歌手}-{歌名}.lkmp3`

## 部署

项目默认部署到 Vercel，无需配置环境变量。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dcdlove/nextjs-music)

## 文档

- [设计迭代计划](docs/DESIGN_ITERATION_PLAN.md) - 产品升级蓝图
- [项目指南](CLAUDE.md) - 开发指南和技术规范

## License

MIT
