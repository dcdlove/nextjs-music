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
| 字体 | Geist Sans + Geist Mono (next/font) |
| 音频 | Web Audio API (音频分析 + 可视化) |
| 测试 | Vitest + React Testing Library |
| 部署 | Vercel |

## 项目架构

```
nextjs-music/
├── app/                              # Next.js App Router
│   ├── api/                          # API 路由层
│   │   ├── res/route.ts              # GitHub 代理接口
│   │   └── res2/route.ts             # jsDelivr CDN 代理接口
│   ├── components/                   # UI 组件
│   │   ├── Player.tsx                # 核心播放器 (整合子组件)
│   │   ├── VinylDisc.tsx             # 黑胶唱片组件
│   │   ├── PlayerControls.tsx        # 播放控制按钮
│   │   ├── TrackInfo.tsx             # 歌曲信息展示
│   │   ├── Controls.tsx              # 搜索框 + 排序模式切换
│   │   ├── SongList.tsx              # 歌曲列表 (支持收藏)
│   │   ├── CircularProgress.tsx      # 圆形进度条 (可拖拽)
│   │   ├── CircularVisualizer.tsx    # 环形音频可视化
│   │   ├── DynamicBackground.tsx     # 动态背景 (随节拍律动)
│   │   ├── ErrorBoundary.tsx         # 错误边界组件
│   │   └── Header.tsx                # 页面标题
│   ├── hooks/                        # 自定义 Hooks
│   │   ├── index.ts                  # 导出入口
│   │   ├── useThemeColor.ts          # 根据曲目生成主题色
│   │   └── audio/                    # 音频相关 Hooks
│   │       ├── useAudioContext.ts    # AudioContext 管理
│   │       ├── useAudioAnalyser.ts   # 音频数据分析
│   │       └── useAudioPlayer.ts     # 播放器控制
│   ├── services/                     # 服务层
│   │   ├── index.ts                  # 导出入口
│   │   └── api/                      # API 服务
│   │       ├── client.ts             # HTTP 客户端
│   │       └── music.ts              # 音乐 API
│   ├── store/                        # 状态管理
│   │   └── index.ts                  # Zustand Store
│   ├── page.tsx                      # 主页面
│   ├── layout.tsx                    # 根布局
│   ├── types.ts                      # TypeScript 类型定义
│   └── globals.css                   # 全局样式 + 动画
├── vitest.config.ts                  # Vitest 配置
├── vitest.setup.ts                   # 测试环境设置
└── public/
    └── data.json                     # 歌曲元数据
```

## 常用命令

```bash
# 开发模式 (使用 Turbopack 加速)
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 运行测试 (监听模式)
npm run test

# 运行测试 (单次)
npm run test:run

# 运行测试并生成覆盖率报告
npm run test:coverage
```

## 核心功能

### 1. 音乐播放
- 在线流式播放 (支持边下边播)
- 播放控制: 上一曲/下一曲/播放/暂停
- 进度条拖拽跳转
- 自动播放下一曲

### 2. 播放列表
- 歌曲搜索 (按歌手名或歌曲名)
- 三种排序模式: `default` (默认) / `random` (随机) / `liked` (收藏)
- 收藏功能 (localStorage 持久化)

### 3. 视觉效果
- 动态主题色: 根据当前曲目生成独特渐变配色
- 黑胶唱片: 3D 悬浮效果 + 旋转动画
- 音频可视化: 实时频谱分析 + 环形可视化器
- 动态背景: 随音乐低音节拍律动

### 4. 响应式适配
- 移动端: 使用 API 代理 (解决跨域问题)
- PC 端: 直连 jsDelivr CDN

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
type SortMode = 'default' | 'random' | 'liked';
```

## API 接口

### GET /api/res
GitHub 代理接口，支持自定义加速节点。

**参数:**
- `name`: 音乐文件名 (需 URL 编码)
- `proxy`: 代理节点 (默认: `ghfast.top`)

### GET /api/res2
jsDelivr CDN 代理接口，用于移动端。

**参数:**
- `name`: 音乐文件名 (需双重 URL 编码)

## 音乐资源

- **存储位置**: GitHub 仓库 `dcdlove/oss` 的 `music/` 目录
- **访问方式**: jsDelivr CDN 或 GitHub 代理
- **命名规范**: `{歌手}-{歌名}.lk{扩展名}` (如 `黄霄雲-星辰大海.lkmp3`)
- **元数据**: `public/data.json` 包含所有歌曲信息

## 开发注意事项

### 1. 状态管理 (Zustand)
- Store 位于 `app/store/index.ts`
- 使用 `useStore()` 获取状态和 actions
- 直接调用 `useStore.getState()` 获取最新状态
- Fisher-Yates 洗牌算法通过 `shuffleArray()` 导出

### 2. 音频上下文
- AudioContext 需要用户交互后才能启动 (浏览器限制)
- 通过 `useAudioContext` hook 管理 AudioContext 生命周期
- 使用 `useAudioAnalyser` hook 获取音频分析数据

### 3. API 服务层
- 使用 `musicApi.fetchPlaylist()` 获取播放列表
- `apiClient` 提供 `get/post` 方法，支持超时和错误处理
- URL 编码在服务层自动处理

### 4. 样式规范
- 主背景色: `#0f172a` (深蓝)
- 强调色通过 `useThemeColor` 动态生成
- 使用 `backdrop-blur` 实现玻璃态效果
- 动画优先使用 CSS `@keyframes`，性能更好

### 5. 组件优化
- 使用 `memo` + 自定义比较函数优化渲染
- 使用 `useCallback` 包装事件处理函数
- 大型组件已拆分为子组件 (VinylDisc, PlayerControls, TrackInfo)

### 6. 错误处理
- `ErrorBoundary` 捕获组件渲染错误
- `AudioErrorBoundary` 专为播放器设计
- API 错误通过 `ApiError` 类统一处理

### 7. 测试
- 测试文件放在源文件同级目录
- 使用 `vitest.setup.ts` 模拟浏览器环境
- 运行 `npm run test:coverage` 查看覆盖率

## 设计风格

- **主题**: 深色 (深蓝紫渐变)
- **背景**: `linear-gradient(135deg, #0f172a, #1e1b4b, #312e81)`
- **玻璃态**: `backdrop-blur-xl` + `bg-white/10`
- **3D 效果**: `perspective` + `transform-style: preserve-3d`
- **动画**: 平滑过渡 + 悬停缩放 + 脉冲效果

## 部署说明

1. 项目默认部署到 Vercel
2. 无需配置环境变量
3. API 路由自动作为 Serverless Functions 运行
4. 静态资源 (data.json) 通过 Vercel CDN 分发

---

*最后更新: 2026年2月*
