# Implementation Plan: 歌词滚动显示 + 播放状态持久化

## 任务类型
- [x] Frontend (UI/UX + 状态管理)
- [ ] Backend
- [x] Fullstack (歌词 API 代理)

---

## 需求分析

### 功能需求
1. **歌词滚动显示**
   - 在动态背景上叠加歌词显示层
   - 支持同步滚动（根据播放进度高亮当前行）
   - 支持 LRC 格式（时间戳歌词）

2. **歌词获取**
   - 自动根据歌手名+歌曲名搜索歌词
   - 使用免费歌词 API（推荐：LRClib、网易云音乐 API）
   - 支持歌词缓存（避免重复请求）

3. **播放状态持久化**
   - 保存当前播放曲目 URL
   - 保存播放进度（currentTime）
   - 保存播放状态（isPlaying）
   - 页面刷新后自动恢复

### 技术约束
- 必须兼容移动端和 PC 端
- 歌词显示不能遮挡黑胶唱片和控制按钮
- 状态持久化不能影响性能
- 需要考虑歌词 API 的速率限制和错误处理

---

## 技术方案

### 歌词获取方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **LRClib API** | 免费、开源、无需认证 | 曲库可能不全 | ⭐⭐⭐⭐⭐ |
| 网易云音乐 API | 曲库丰富 | 需要代理、可能有版权限制 | ⭐⭐⭐ |
| 本地 LRC 文件 | 稳定可靠 | 需要手动准备 | ⭐⭐ |
| 音乐文件内嵌 | 一次获取 | 解析复杂、不是所有文件都有 | ⭐⭐ |

**推荐方案**: 使用 LRClib API (https://lrclib.net/docs) 作为主要歌词来源

### 歌词显示位置方案对比

| 位置 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **背景层底部** | 不遮挡主体、沉浸感强 | 移动端可能被遮挡 | ⭐⭐⭐⭐⭐ |
| 黑胶唱片上方 | 靠近播放器 | 可能遮挡动画效果 | ⭐⭐⭐ |
| 侧边栏 | 独立区域 | 需要额外 UI 空间 | ⭐⭐ |

**推荐方案**: 在 DynamicBackground 组件中添加歌词层，定位在页面下半部分

### 状态持久化方案

**推荐方案**: 扩展现有 localStorage 持久化机制

```typescript
// 新增持久化状态
interface PlayerPersistence {
  audioUrl: string;      // 当前曲目 URL
  currentTime: number;   // 播放进度（秒）
  isPlaying: boolean;    // 播放状态
  volume: number;        // 音量
  timestamp: number;     // 保存时间戳（用于判断是否过期）
}
```

---

## 实现步骤

### Step 1: 定义歌词相关类型和接口
**文件**: `app/types.ts`

```typescript
// LRC 歌词行
export interface LyricLine {
  time: number;      // 时间（秒）
  text: string;      // 歌词文本
}

// 歌词数据
export interface Lyrics {
  id: string;            // 歌词 ID
  singer: string;        // 歌手名
  title: string;         // 歌曲名
  plainLyrics: string;   // 纯文本歌词
  syncedLyrics: LyricLine[];  // 同步歌词（带时间戳）
  source: string;        // 来源
}
```

**预期产出**: 完整的歌词相关类型定义

---

### Step 2: 创建歌词 API 服务
**文件**: `app/services/api/lyrics.ts`

```typescript
// 歌词 API 服务
export const lyricsApi = {
  // 搜索歌词
  async searchLyrics(singer: string, title: string): Promise<Lyrics | null>,

  // 解析 LRC 格式歌词
  parseLrc(lrcText: string): LyricLine[],
}
```

**API 端点**: `https://lrclib.net/api/get?artist_name=${artist}&track_name=${title}`

**预期产出**: 歌词获取和解析服务

---

### Step 3: 创建歌词缓存服务
**文件**: `app/services/lyricsCache.ts`

```typescript
// 歌词缓存（localStorage + 内存）
export const lyricsCache = {
  get(key: string): Lyrics | null,
  set(key: string, lyrics: Lyrics): void,
  clear(): void,
}
```

**预期产出**: 歌词缓存管理

---

### Step 4: 扩展 Store 添加歌词状态
**文件**: `app/store/index.ts`

新增状态和 Actions:
```typescript
interface Store {
  // ... 现有状态

  // 歌词状态
  lyrics: Lyrics | null;
  currentLyricIndex: number;  // 当前行索引
  isLyricsLoading: boolean;
  lyricsError: string | null;

  // 歌词 Actions
  fetchLyrics: (singer: string, title: string) => Promise<void>;
  updateCurrentLyricIndex: (currentTime: number) => void;
  setLyrics: (lyrics: Lyrics | null) => void;
}
```

**预期产出**: 歌词状态管理

---

### Step 5: 创建歌词显示组件
**文件**: `app/components/LyricsDisplay.tsx`

```typescript
interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentIndex: number;
  isPlaying: boolean;
  themeColor?: ThemeColor;
}
```

**功能特性**:
- 自动滚动到当前行
- 当前行高亮显示
- 平滑滚动动画
- 玻璃态背景效果

**预期产出**: 歌词显示 UI 组件

---

### Step 6: 扩展 Store 添加播放状态持久化
**文件**: `app/store/index.ts`

新增持久化逻辑:
```typescript
// 持久化 key
const PLAYER_STATE_KEY = 'playerState';

// 持久化状态
interface PlayerPersistence {
  audioUrl: string;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  timestamp: number;
}

// Actions
savePlayerState: () => void;
loadPlayerState: () => PlayerPersistence | null;
```

**预期产出**: 播放状态持久化功能

---

### Step 7: 修改 Player 组件添加进度同步
**文件**: `app/components/Player.tsx`

修改内容:
- 在 `handleTimeUpdate` 中调用 `updateCurrentLyricIndex`
- 在 `handleTimeUpdate` 中定期保存播放状态

**预期产出**: 播放器与歌词同步

---

### Step 8: 修改 DynamicBackground 集成歌词显示
**文件**: `app/components/DynamicBackground.tsx`

新增歌词层:
```tsx
{/* 歌词显示层 - 位于页面底部 */}
{lyrics && (
  <LyricsDisplay
    lyrics={lyrics.syncedLyrics}
    currentIndex={currentLyricIndex}
    isPlaying={isPlaying}
    themeColor={themeColor}
  />
)}
```

**预期产出**: 动态背景集成歌词显示

---

### Step 9: 修改主页面添加状态恢复逻辑
**文件**: `app/page.tsx`

新增逻辑:
- 页面加载时从 localStorage 恢复播放状态
- 恢复播放进度（如果不超过 24 小时）

**预期产出**: 页面刷新后状态恢复

---

### Step 10: 添加歌词相关动画样式
**文件**: `app/globals.css`

新增样式:
```css
/* 歌词滚动动画 */
@keyframes lyrics-scroll { ... }

/* 歌词行高亮动画 */
@keyframes lyric-line-highlight { ... }

/* 歌词淡入动画 */
@keyframes lyrics-fade-in { ... }
```

**预期产出**: 歌词相关 CSS 动画

---

## 关键文件变更

| 文件 | 操作 | 描述 |
|------|------|------|
| [types.ts](app/types.ts) | 修改 | 添加 LyricLine, Lyrics 类型定义 |
| [services/api/lyrics.ts](app/services/api/lyrics.ts) | 新增 | 歌词 API 服务 |
| [services/lyricsCache.ts](app/services/lyricsCache.ts) | 新增 | 歌词缓存服务 |
| [store/index.ts](app/store/index.ts) | 修改 | 添加歌词状态和持久化逻辑 |
| [components/LyricsDisplay.tsx](app/components/LyricsDisplay.tsx) | 新增 | 歌词显示组件 |
| [components/Player.tsx](app/components/Player.tsx) | 修改 | 添加进度同步和状态保存 |
| [components/DynamicBackground.tsx](app/components/DynamicBackground.tsx) | 修改 | 集成歌词显示层 |
| [page.tsx](app/page.tsx) | 修改 | 添加状态恢复逻辑 |
| [globals.css](app/globals.css) | 修改 | 添加歌词相关动画样式 |

---

## 风险与缓解措施

| 风险 | 缓解措施 |
|------|----------|
| 歌词 API 不可用或限流 | 实现多源回退机制（LRClib → 网易云 → 本地缓存） |
| 歌词与音乐不同步 | 提供手动偏移调整功能（后续迭代） |
| 播放进度恢复不准确 | 保存时间戳，超过 24 小时自动重置 |
| 移动端歌词遮挡控制 | 响应式设计，移动端降低歌词层高度 |
| localStorage 容量限制 | 定期清理过期缓存，限制歌词缓存数量 |
| 首次加载性能影响 | 懒加载歌词组件，优先加载播放器 |

---

## 测试策略

### 单元测试
- [ ] `parseLrc` 函数测试（各种 LRC 格式）
- [ ] 歌词缓存读写测试
- [ ] 播放状态持久化测试
- [ ] Store actions 测试

### 集成测试
- [ ] 歌词获取流程测试
- [ ] 播放器与歌词同步测试
- [ ] 页面刷新状态恢复测试

### E2E 测试
- [ ] 完整播放流程 + 歌词显示
- [ ] 跨页面状态保持

---

## 实现顺序建议

1. **Phase 1: 基础设施** (types + API + 缓存)
2. **Phase 2: 状态管理** (Store 扩展)
3. **Phase 3: UI 组件** (LyricsDisplay)
4. **Phase 4: 集成** (Player + DynamicBackground + page)
5. **Phase 5: 持久化** (播放状态保存/恢复)
6. **Phase 6: 优化与测试**

---

## 预估工作量

| 阶段 | 文件数 | 复杂度 |
|------|--------|--------|
| Phase 1 | 3 | 低 |
| Phase 2 | 1 | 中 |
| Phase 3 | 1 | 中 |
| Phase 4 | 3 | 中 |
| Phase 5 | 2 | 中 |
| Phase 6 | - | 低 |

---

## SESSION_ID (for /ccg:execute use)
- CODEX_SESSION: N/A (环境未配置)
- GEMINI_SESSION: N/A (环境未配置)

---

*Plan generated at: 2026-03-02*
