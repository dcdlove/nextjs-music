# Serendipity Music Player - 项目指南

> 一款基于 Next.js 15 的在线音乐播放器，采用黑胶唱片风格设计，支持音频可视化和动态主题色。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15.3.6 (App Router + Turbopack) |
| 前端 | React 19 (函数组件 + Hooks) |
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS 4 + 自定义 CSS 动画 |
| 状态 | Zustand 5 |
| 虚拟化 | @tanstack/react-virtual |
| 字体 | Playfair Display + Plus Jakarta Sans + JetBrains Mono + Noto Serif SC |
| 音频 | Web Audio API (音频分析 + 可视化) |
| 歌词 | LRClib API + opencc-js (繁简转换) |
| 测试 | Vitest + React Testing Library |
| 部署 | Vercel |

## 项目架构

```
nextjs-music/
├── app/                              # Next.js App Router
│   ├── api/                          # API 路由层
│   │   ├── res/route.ts              # GitHub 代理接口
│   │   ├── res2/route.ts             # GitHub 代理接口（移动端）
│   │   ├── playlist/route.ts         # 远程播放列表读取接口
│   │   ├── singer-avatars/route.ts   # 歌手头像映射读取接口
│   │   ├── admin/songs/route.ts      # 歌曲上传接口
│   │   └── admin/avatars/route.ts    # 歌手头像上传接口
│   ├── admin/                        # 上传管理页面
│   ├── components/                   # UI 组件
│   │   ├── Player.tsx                # 核心播放器 (整合子组件)
│   │   ├── VinylDisc.tsx             # 黑胶唱片组件
│   │   ├── PlayerControls.tsx        # 播放控制按钮
│   │   ├── TrackInfo.tsx             # 歌曲信息展示
│   │   ├── Controls.tsx              # 搜索框 + 排序模式切换
│   │   ├── SongList.tsx              # 歌曲列表 (虚拟化 + 收藏)
│   │   ├── SingerList.tsx            # 歌手列表 (虚拟化)
│   │   ├── LyricsDisplay.tsx         # 歌词显示组件
│   │   ├── CircularProgress.tsx      # 圆形进度条 (可拖拽)
│   │   ├── CircularVisualizer.tsx    # 环形音频可视化
│   │   ├── DynamicBackground.tsx     # 动态背景 (随节拍律动)
│   │   ├── ErrorBoundary.tsx         # 错误边界组件
│   │   └── Header.tsx                # 页面标题
│   ├── hooks/                        # 自定义 Hooks
│   │   ├── index.ts                  # 导出入口
│   │   ├── useThemeColor.ts          # 根据曲目生成主题色
│   │   ├── useSingerAvatar.ts        # 歌手头像
│   │   └── audio/                    # 音频相关 Hooks
│   │       ├── useAudioContext.ts    # AudioContext 管理
│   │       ├── useAudioAnalyser.ts   # 音频数据分析
│   │       └── useAudioPlayer.ts     # 播放器控制
│   ├── services/                     # 服务层
│   │   ├── index.ts                  # 导出入口
│   │   ├── lyricsCache.ts            # 歌词缓存
│   │   ├── avatar/                   # 歌手头像服务
│   │   └── api/                      # API 服务
│   │       ├── client.ts             # HTTP 客户端
│   │       ├── music.ts              # 音乐 API
│   │       └── lyrics.ts             # 歌词 API
│   ├── store/                        # 状态管理
│   │   └── index.ts                  # Zustand Store
│   ├── utils/                        # 工具函数
│   │   ├── singerParser.ts           # 歌手名解析 (支持 & 分隔)
│   │   ├── chineseConverter.ts       # 繁转简工具
│   │   └── performanceLogger.ts      # 性能分析工具
│   ├── server/                       # 服务端能力
│   │   └── githubContents.ts         # GitHub Contents API 封装
│   ├── page.tsx                      # 主页面
│   ├── layout.tsx                    # 根布局
│   ├── types.ts                      # TypeScript 类型定义
│   ├── globals.css                   # 全局样式 + 动画
│   ├── opengraph-image.tsx           # OG 图片
│   ├── icon.tsx                      # 图标
│   ├── apple-icon.tsx                # Apple 图标
│   └── favicon.ico                   # Favicon
├── vitest.config.ts                  # Vitest 配置
├── vitest.setup.ts                   # 测试环境设置
└── public/
    ├── data.json                     # 歌曲元数据
    └── default-avatar.svg            # 默认头像
```

## 常用命令

```bash
# 开发模式 (使用 Turbopack 加速)
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint

# 运行测试 (监听模式)
pnpm test

# 运行测试 (单次)
pnpm test:run

# 运行测试并生成覆盖率报告
pnpm test:coverage
```

## 核心功能

### 1. 音乐播放
- 在线流式播放 (支持边下边播)
- 播放控制: 上一曲/下一曲/播放/暂停
- 进度条拖拽跳转
- 自动播放下一曲
- 播放状态持久化（24 小时内恢复进度/音量/曲目）

### 2. 播放列表
- 歌曲搜索 (按歌手名或歌曲名)
- 两种排序模式: `default` (默认) / `liked` (收藏)
- 收藏功能 (localStorage 持久化)
- 虚拟化列表 (@tanstack/react-virtual)

### 3. 歌词
- LRClib API 获取歌词
- 同步歌词滚动 + 当前行高亮
- 繁体转简体 (opencc-js + 手工修正)

### 4. 歌手列表与头像
- 按歌手分类浏览歌曲
- 多歌手解析 (支持 & 分隔符，如 "歌手A&歌手B")
- 点击歌手名快速筛选
- 虚拟化列表优化滚动性能
- 头像映射服务 + 默认头像占位

### 5. 视觉效果
- 动态主题色: 根据当前曲目生成独特渐变配色
- 黑胶唱片: 3D 悬浮效果 + 旋转动画
- 音频可视化: 实时频谱分析 + 环形可视化器
- 动态背景: 随音乐低音节拍律动

### 6. 响应式适配
- 移动端: 使用 API 代理 (解决跨域问题)
- PC 端: 直连 jsDelivr CDN

### 7. 交互与快捷键
- Space 播放/暂停
- ←/→ 上一曲/下一曲
- P 打开/关闭播放列表
- S 打开/关闭歌手列表
- / 聚焦搜索框（播放列表中）

## 数据结构

### Song 类型
```typescript
interface Song {
  singer: string;    // 歌手名
  title: string;     // 歌曲名
  ext: string;       // 文件扩展名 (如 ".mp3")
  url: string;       // 播放地址 (PC 端用 CDN)
  url2?: string;     // 备用地址 (移动端用代理)
  null?: boolean;    // 是否无效
}
```

### 排序模式
```typescript
type SortMode = 'default' | 'liked';
```

### Lyrics 类型
```typescript
interface LyricLine {
  time: number;    // 时间（秒）
  text: string;    // 歌词文本
}

interface Lyrics {
  id: string;
  singer: string;
  title: string;
  plainLyrics: string;
  syncedLyrics: LyricLine[];
  source: string;
}
```

### PlayerPersistence 类型
```typescript
interface PlayerPersistence {
  audioUrl: string;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  timestamp: number;
}
```

## API 接口

### GET /api/res
GitHub 代理接口（支持 Range，流式播放）。

**参数:**
- `name`: 音乐文件名 (需 URL 编码)
- `proxy`: 代理节点 (默认: `ghfast.top`)

### GET /api/res2
GitHub 代理接口（移动端默认使用，直接转发流式响应）。

**参数:**
- `name`: 音乐文件名 (需 URL 编码，移动端客户端会做双重编码)
- `proxy`: 代理节点 (默认: `ghfast.top`)

### GET /api/playlist
读取 GitHub 仓库中的播放列表（默认 `music/data.json`），失败时回退到本地 `public/data.json`。

### GET /api/singer-avatars
读取歌手头像映射（默认 `img/singer-avatars.json`），优先 GitHub Contents API，失败时回退到 `raw.githubusercontent.com`，最终返回空映射。

### POST /api/admin/songs
上传歌曲到 GitHub 仓库并更新播放列表。

**请求方式**：`multipart/form-data`

**字段：**
- `file`：歌曲文件（`.mp3` / `.lkmp3`）
- `singer`：歌手名
- `title`：歌曲名
- `overwrite`：是否覆盖同名文件（可选，`true/false`）

**鉴权：**
- 请求头 `x-admin-token` 或 `Authorization: Bearer <token>`

### POST /api/admin/avatars
上传歌手头像并更新映射文件。

**请求方式**：`multipart/form-data`

**字段：**
- `file`：头像文件（`.jpg/.jpeg/.png/.webp/.gif/.avif/.svg`）
- `singer`：歌手名
- `overwrite`：是否覆盖同名文件（可选，`true/false`）

**鉴权：**
- 请求头 `x-admin-token` 或 `Authorization: Bearer <token>`

## 音乐资源

- **存储位置**: GitHub 仓库 `dcdlove/oss` 的 `music/` 目录
- **访问方式**: jsDelivr CDN 或 GitHub 代理
- **命名规范**: `{歌手}-{歌名}.lkmp3`（播放列表 `ext` 为 `.mp3`）
- **元数据**: 优先读取仓库 `music/data.json`，失败时回退 `public/data.json`

## 开发注意事项

### 1. 状态管理 (Zustand)
- Store 位于 `app/store/index.ts`
- 使用 `useStore()` 获取状态和 actions
- 直接调用 `useStore.getState()` 获取最新状态

### 2. 音频上下文
- AudioContext 需要用户交互后才能启动 (浏览器限制)
- 通过 `useAudioContext` hook 管理 AudioContext 生命周期
- 使用 `useAudioAnalyser` hook 获取音频分析数据

### 3. API 服务层
- 使用 `musicApi.fetchPlaylist()` 获取播放列表
- `apiClient` 提供 `get/post` 方法，支持超时和错误处理
- URL 编码在服务层自动处理

### 4. 歌词与文本
- 使用 `lyricsApi.searchLyrics()` 从 LRClib 获取歌词
- `app/services/lyricsCache.ts` 做内存缓存，避免重复请求
- `app/utils/chineseConverter.ts` 按需加载 opencc-js 做繁转简

### 5. 歌手头像
- `app/services/avatar` 读取 `/api/singer-avatars`
- `useSingerAvatar` / `useSingerAvatars` 封装头像读取与缓存
- 无匹配时回退默认头像与渐变占位

### 6. 样式规范
- 主背景色: `#0f172a` (深蓝)
- 强调色通过 `useThemeColor` 动态生成
- 使用 `backdrop-blur` 实现玻璃态效果
- 动画优先使用 CSS `@keyframes`，性能更好

### 7. 组件优化
- 使用 `memo` + 自定义比较函数优化渲染
- 使用 `useCallback` 包装事件处理函数
- 大型组件已拆分为子组件 (VinylDisc, PlayerControls, TrackInfo)
- 列表虚拟化 (@tanstack/react-virtual) 优化大列表性能
- 音频数据使用 ref 而非 state，避免高频更新触发重渲染

### 8. 错误处理
- `ErrorBoundary` 捕获组件渲染错误
- `AudioErrorBoundary` 专为播放器设计
- API 错误通过 `ApiError` 类统一处理

### 9. 测试
- 测试文件放在源文件同级目录
- 使用 `vitest.setup.ts` 模拟浏览器环境
 - 运行 `pnpm test:coverage` 查看覆盖率

## 设计风格

- **主题**: 深色 (深蓝紫渐变)
- **背景**: `linear-gradient(135deg, #0f172a, #1e1b4b, #312e81)`
- **玻璃态**: `backdrop-blur-xl` + `bg-white/10`
- **3D 效果**: `perspective` + `transform-style: preserve-3d`
- **动画**: 平滑过渡 + 悬停缩放 + 脉冲效果

## 部署说明

1. 项目默认部署到 Vercel
2. 只读浏览可不配环境变量，但建议配置 `GITHUB_TOKEN` 以减少 GitHub API 频率限制
3. 管理端上传必须配置 `ADMIN_TOKEN` 与 `GITHUB_TOKEN`（以及仓库相关配置）
4. API 路由自动作为 Serverless Functions (Node.js runtime) 运行
5. 静态资源 (data.json) 通过 Vercel CDN 分发

---

*最后更新: 2026年3月*
