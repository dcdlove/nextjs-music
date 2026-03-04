import React, { memo, useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { parseSingers } from '../utils/singerParser'
import { SingerAvatarResult } from '../services/avatar'
import { useSingerAvatars, useSingerGradient } from '../hooks/useSingerAvatar'

/**
 * 歌手信息接口
 */
interface SingerInfo {
  name: string
  songCount: number
  songs: Array<{ title: string; url: string }>
}

/**
 * 从歌曲列表提取歌手信息
 */
function extractSingers(songs: Array<{ singer: string; title: string; url: string }>): SingerInfo[] {
  const singerMap = new Map<string, Array<{ title: string; url: string }>>()

  for (const song of songs) {
    const individualSingers = parseSingers(song.singer)
    for (const singerName of individualSingers) {
      const existing = singerMap.get(singerName)
      if (existing) {
        existing.push({ title: song.title, url: song.url })
      } else {
        singerMap.set(singerName, [{ title: song.title, url: song.url }])
      }
    }
  }

  return Array.from(singerMap.entries())
    .map(([name, singerSongs]) => ({
      name,
      songCount: singerSongs.length,
      songs: singerSongs
    }))
    .sort((a, b) => b.songCount - a.songCount)
}

/**
 * 单个歌手项组件
 */
interface SingerItemProps {
  singer: SingerInfo
  avatar?: SingerAvatarResult
  index: number
  isCurrentSinger: boolean
  isFocused: boolean
  onFocus: () => void
  onClick: () => void
}

const SingerItem = memo(function SingerItem({
  singer,
  avatar,
  index,
  isCurrentSinger,
  isFocused,
  onFocus,
  onClick
}: SingerItemProps) {
  const [imageLoadError, setImageLoadError] = useState(false)

  useEffect(() => {
    setImageLoadError(false)
  }, [avatar?.url])

  // 生成基于歌手名的渐变色（作为背景或备选）
  const gradient = useSingerGradient(singer.name)

  // 判断是否显示真实头像
  const hasRealAvatar = Boolean(avatar && avatar.source !== 'fallback' && avatar.url && !imageLoadError)
  const avatarUrl = avatar?.url

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
    >
      <span
        className={`
          w-6 text-xs font-mono select-none
          ${isCurrentSinger ? 'text-cyan-400' : isFocused ? 'text-cyan-300/70' : 'text-white/30 group-hover:text-white/50'}
        `}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      <div
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          relative overflow-hidden flex-shrink-0
          ${isCurrentSinger
            ? 'ring-2 ring-cyan-400/30'
            : isFocused
              ? 'ring-1 ring-cyan-400/20'
              : ''
          }
        `}
        style={{ background: hasRealAvatar ? 'transparent' : gradient }}
      >
        {isCurrentSinger && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/30 to-cyan-400/0 animate-[shimmer_2s_infinite]"
            style={{ transform: 'translateZ(0)' }}
          />
        )}

        {/* 真实头像或默认图标 */}
        {hasRealAvatar ? (
          <img
            src={avatarUrl}
            alt={singer.name}
            className="w-full h-full object-cover rounded-full"
            loading="lazy"
            onError={() => {
              // 加载失败时切换到默认图标 + 渐变背景
              setImageLoadError(true)
            }}
          />
        ) : (
          <svg
            className={`relative w-6 h-6 ${isCurrentSinger ? 'text-cyan-400' : isFocused ? 'text-white/70' : 'text-white/60'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-bold truncate ${isCurrentSinger ? 'text-cyan-300' : isFocused ? 'text-white/90' : 'text-white/80 group-hover:text-white'}`}>
          {singer.name}
        </p>
        <p className="text-xs text-white/40 mt-0.5 flex items-center gap-1.5">
          <span className="tabular-nums">{singer.songCount}</span>
          <span>首歌曲</span>
        </p>
      </div>

      <svg
        className={`w-5 h-5 flex-shrink-0 ${isCurrentSinger ? 'text-cyan-400 opacity-100' : isFocused ? 'text-cyan-400/60 opacity-80' : 'text-white/20 opacity-0 group-hover:opacity-100 group-hover:text-white/40'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
})
SingerItem.displayName = 'SingerItem'

interface SingerListProps {
  songs: Array<{ singer: string; title: string; url: string }>
  currentSinger?: string
  onSingerClick: (singer: string) => void
  searchTerm?: string
  onSearchChange?: (term: string) => void
}

/**
 * 歌手列表组件（虚拟化）
 */
function SingerListComponent({
  songs,
  currentSinger,
  onSingerClick,
  searchTerm = '',
  onSearchChange
}: SingerListProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  const listRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 提取歌手信息
  const allSingers = useMemo(() => extractSingers(songs), [songs])
  const avatarSingerNames = useMemo(() => allSingers.map(s => s.name), [allSingers])
  const { avatars } = useSingerAvatars(avatarSingerNames)

  // 过滤歌手
  const filteredSingers = useMemo(() => {
    if (!localSearchTerm.trim()) return allSingers
    const term = localSearchTerm.toLowerCase()
    return allSingers.filter(s => s.name.toLowerCase().includes(term))
  }, [allSingers, localSearchTerm])

  // 当前播放歌手
  const currentSingerSet = useMemo(() => {
    if (!currentSinger) return new Set<string>()
    return new Set(parseSingers(currentSinger))
  }, [currentSinger])

  // 虚拟化配置 - 优化滚动性能
  const rowVirtualizer = useVirtualizer({
    count: filteredSingers.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 80,
    overscan: 3, // 减少 overscan 以降低快速滚动时的渲染压力
  })

  // 同步搜索词
  useEffect(() => {
    setLocalSearchTerm(searchTerm)
  }, [searchTerm])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value)
    onSearchChange?.(e.target.value)
    setFocusedIndex(-1)
  }, [onSearchChange])

  const handleClearSearch = useCallback(() => {
    setLocalSearchTerm('')
    onSearchChange?.('')
    searchInputRef.current?.focus()
  }, [onSearchChange])

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
        localSearchTerm ? handleClearSearch() : setFocusedIndex(-1)
        break
    }
  }, [filteredSingers, focusedIndex, onSingerClick, localSearchTerm, handleClearSearch])

  return (
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
      {/* 搜索框 */}
      {onSearchChange && (
        <div className="mb-4 relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className={`h-4 w-4 ${localSearchTerm ? 'text-cyan-400' : 'text-white/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 text-sm"
          />
          {localSearchTerm && (
            <button onClick={handleClearSearch} aria-label="清除搜索" className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white/80">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* 虚拟化列表 */}
      <div
        ref={listRef}
        role="listbox"
        aria-label="歌手列表"
        className="flex-1 overflow-y-auto pr-2 custom-scrollbar focus:outline-none"
        tabIndex={0}
      >
        {filteredSingers.length > 0 && (
          <div style={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const singer = filteredSingers[virtualRow.index]
              return (
                <div
                  key={singer.name}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <SingerItem
                    singer={singer}
                    avatar={avatars.get(singer.name) || undefined}
                    index={virtualRow.index}
                    isCurrentSinger={currentSingerSet.has(singer.name)}
                    isFocused={focusedIndex === virtualRow.index}
                    onFocus={() => setFocusedIndex(virtualRow.index)}
                    onClick={() => onSingerClick(singer.name)}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* 空状态 */}
        {filteredSingers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-white/30">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-cyan-400/20 blur-2xl rounded-full scale-150" />
              <svg className="relative w-20 h-20 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-2">未找到匹配的歌手</p>
            <p className="text-xs text-white/20">尝试调整搜索关键词</p>
          </div>
        )}
      </div>

    </div>
  )
}

const SingerList = memo(SingerListComponent)
SingerList.displayName = 'SingerList'

export default SingerList
