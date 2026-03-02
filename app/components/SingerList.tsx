import React, { memo, useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { parseSingers } from '../utils/singerParser'

/**
 * 歌手信息接口
 */
interface SingerInfo {
  /** 歌手名 */
  name: string
  /** 该歌手的歌曲数量 */
  songCount: number
  /** 代表性歌曲列表 */
  songs: Array<{ title: string; url: string }>
}

/**
 * 从歌曲列表提取歌手信息
 * 支持多歌手分隔：& 、，, and 和 与
 */
function extractSingers(songs: Array<{ singer: string; title: string; url: string }>): SingerInfo[] {
  const singerMap = new Map<string, Array<{ title: string; url: string }>>()

  songs.forEach(song => {
    // 解析歌手字符串，拆分为独立歌手
    const individualSingers = parseSingers(song.singer)

    individualSingers.forEach(singerName => {
      const existing = singerMap.get(singerName)
      if (existing) {
        existing.push({ title: song.title, url: song.url })
      } else {
        singerMap.set(singerName, [{ title: song.title, url: song.url }])
      }
    })
  })

  return Array.from(singerMap.entries())
    .map(([name, singerSongs]) => ({
      name,
      songCount: singerSongs.length,
      songs: singerSongs
    }))
    .sort((a, b) => b.songCount - a.songCount)
}

/**
 * 单个歌手项组件 - 使用 memo 优化
 */
interface SingerItemProps {
  singer: SingerInfo
  index: number
  isCurrentSinger: boolean
  isFocused: boolean
  onFocus: () => void
  onClick: () => void
}

const SingerItem = memo(function SingerItem({
  singer,
  index,
  isCurrentSinger,
  isFocused,
  onFocus,
  onClick
}: SingerItemProps) {
  return (
    <button
      role="option"
      aria-selected={isCurrentSinger}
      tabIndex={isFocused ? 0 : -1}
      onFocus={onFocus}
      onClick={onClick}
      className={`
        w-full group relative flex items-center gap-4 p-4 rounded-2xl
        text-left focus:outline-none
        ${isCurrentSinger
          ? 'bg-white/10 border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
          : isFocused
            ? 'bg-white/[0.08] border border-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.08)]'
            : 'bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/10'
        }
      `}
      // 性能优化：使用 will-change 提示浏览器
      style={{ willChange: isFocused || isCurrentSinger ? 'transform' : 'auto' }}
    >
      {/* 序号 */}
      <span
        className={`
          w-6 text-xs font-mono select-none
          ${isCurrentSinger ? 'text-cyan-400' : isFocused ? 'text-cyan-300/70' : 'text-white/30 group-hover:text-white/50'}
        `}
        aria-label={`第 ${index + 1} 位`}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* 歌手头像 */}
      <div
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          relative overflow-hidden flex-shrink-0
          ${isCurrentSinger
            ? 'bg-gradient-to-br from-cyan-400/20 to-purple-500/20 ring-2 ring-cyan-400/30'
            : isFocused
              ? 'bg-white/10 ring-1 ring-cyan-400/20'
              : 'bg-white/5 group-hover:bg-white/10'
          }
        `}
      >
        {/* 当前播放时的动态光环 - 仅在播放时渲染 */}
        {isCurrentSinger && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/30 to-cyan-400/0 animate-[shimmer_2s_infinite]"
            style={{ transform: 'translateZ(0)' }}
          />
        )}
        <svg
          className={`relative w-6 h-6 ${isCurrentSinger ? 'text-cyan-400' : isFocused ? 'text-white/70' : 'text-white/40 group-hover:text-white/60'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>

      {/* 歌手信息 */}
      <div className="flex-1 min-w-0">
        <p
          className={`
            font-bold truncate
            ${isCurrentSinger ? 'text-cyan-300' : isFocused ? 'text-white/90' : 'text-white/80 group-hover:text-white'}
          `}
        >
          {singer.name}
        </p>
        <p className="text-xs text-white/40 mt-0.5 flex items-center gap-1.5">
          <span className="tabular-nums">{singer.songCount}</span>
          <span>首歌曲</span>
        </p>
      </div>

      {/* 箭头指示 */}
      <svg
        className={`
          w-5 h-5 flex-shrink-0
          ${isCurrentSinger ? 'text-cyan-400 opacity-100' : isFocused ? 'text-cyan-400/60 opacity-80' : 'text-white/20 opacity-0 group-hover:opacity-100 group-hover:text-white/40'}
        `}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
})

/**
 * SingerList 组件 Props
 */
interface SingerListProps {
  /** 所有歌曲列表 */
  songs: Array<{ singer: string; title: string; url: string }>
  /** 当前播放的歌手 */
  currentSinger?: string
  /** 点击歌手回调 */
  onSingerClick: (singer: string) => void
  /** 搜索关键词（可选） */
  searchTerm?: string
  /** 搜索回调（可选） */
  onSearchChange?: (term: string) => void
}

/**
 * 歌手列表组件
 * 支持键盘导航、搜索、无障碍访问
 * 性能优化：预计算、memo、will-change
 */
function SingerListComponent({
  songs,
  currentSinger,
  onSingerClick,
  searchTerm = '',
  onSearchChange
}: SingerListProps) {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  const listRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 提取歌手信息
  const allSingers = useMemo(() => extractSingers(songs), [songs])

  // 根据搜索词过滤歌手
  const filteredSingers = useMemo(() => {
    if (!localSearchTerm.trim()) return allSingers
    const term = localSearchTerm.toLowerCase()
    return allSingers.filter(singer =>
      singer.name.toLowerCase().includes(term)
    )
  }, [allSingers, localSearchTerm])

  // 预计算当前播放的歌手列表（性能优化：只解析一次）
  const currentSingerSet = useMemo(() => {
    if (!currentSinger) return new Set<string>()
    return new Set(parseSingers(currentSinger))
  }, [currentSinger])

  // 当前播放歌手的索引
  const currentSingerIndex = useMemo(() => {
    if (currentSingerSet.size === 0) return -1
    return filteredSingers.findIndex(s => currentSingerSet.has(s.name))
  }, [filteredSingers, currentSingerSet])

  // 同步外部搜索词
  useEffect(() => {
    setLocalSearchTerm(searchTerm)
  }, [searchTerm])

  // 搜索输入变化
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearchTerm(value)
    onSearchChange?.(value)
    setFocusedIndex(-1)
  }, [onSearchChange])

  // 清除搜索
  const handleClearSearch = useCallback(() => {
    setLocalSearchTerm('')
    onSearchChange?.('')
    searchInputRef.current?.focus()
  }, [onSearchChange])

  // 键盘导航
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, filteredSingers.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < filteredSingers.length) {
          onSingerClick(filteredSingers[focusedIndex].name)
        }
        break
      case 'Escape':
        if (localSearchTerm) {
          handleClearSearch()
        } else {
          setFocusedIndex(-1)
        }
        break
    }
  }, [filteredSingers, focusedIndex, onSingerClick, localSearchTerm, handleClearSearch])

  // 自动滚动到当前歌手（使用 requestAnimationFrame 优化）
  useEffect(() => {
    if (currentSingerIndex >= 0 && listRef.current) {
      // 使用 RAF 避免阻塞主线程
      requestAnimationFrame(() => {
        if (!listRef.current) return
        const items = listRef.current.querySelectorAll('[role="option"]')
        const targetItem = items[currentSingerIndex] as HTMLElement
        targetItem?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    }
  }, [currentSingerIndex])

  // 过滤后列表变化时重置聚焦
  useEffect(() => {
    setFocusedIndex(-1)
  }, [filteredSingers.length])

  return (
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
      {/* 搜索框 */}
      {onSearchChange && (
        <div className="mb-4 relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className={`h-4 w-4 ${localSearchTerm ? 'text-cyan-400' : 'text-white/40 group-focus-within:text-cyan-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="搜索歌手..."
            value={localSearchTerm}
            onChange={handleSearchChange}
            aria-label="搜索歌手"
            className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:bg-white/10 text-sm"
          />
          {/* 清除按钮 */}
          {localSearchTerm && (
            <button
              onClick={handleClearSearch}
              aria-label="清除搜索"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white/80"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* 歌手列表 - 性能优化：使用 contain 提示浏览器 */}
      <div
        ref={listRef}
        role="listbox"
        aria-label="歌手列表"
        className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar focus:outline-none"
        tabIndex={0}
        style={{ contain: 'layout style' }}
      >
        {filteredSingers.map((singer, index) => (
          <SingerItem
            key={singer.name}
            singer={singer}
            index={index}
            isCurrentSinger={currentSingerSet.has(singer.name)}
            isFocused={focusedIndex === index}
            onFocus={() => setFocusedIndex(index)}
            onClick={() => onSingerClick(singer.name)}
          />
        ))}
      </div>

      {/* 空状态 */}
      {filteredSingers.length === 0 && (
        <div
          className="flex-1 flex flex-col items-center justify-center py-16 text-white/30"
          role="status"
          aria-live="polite"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-cyan-400/20 blur-2xl rounded-full scale-150" />
            <svg
              className="relative w-20 h-20 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium mb-2">未找到匹配的歌手</p>
          <p className="text-xs text-white/20">尝试调整搜索关键词</p>
        </div>
      )}

      {/* 动画样式 */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

const SingerList = memo(SingerListComponent)
SingerList.displayName = 'SingerList'

export default SingerList
