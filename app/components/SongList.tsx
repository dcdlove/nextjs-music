import React, { memo, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Song } from '../types'

interface SongItemProps {
  item: Song
  index: number
  isPlaying: boolean
  isLiked: boolean
  onPlay: (url: string) => void
  onLike: (url: string) => void
  isFocused: boolean
  onFocus: () => void
  searchTerm: string
}

/**
 * 高亮搜索关键词（使用缓存优化）
 */
const HighlightText = memo(({ text, searchTerm }: { text: string; searchTerm: string }) => {
  // 缓存正则表达式
  const regex = useMemo(() => {
    if (!searchTerm.trim()) return null
    return new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  }, [searchTerm])

  // 缓存分割结果
  const parts = useMemo(() => {
    if (!regex) return [text]
    return text.split(regex)
  }, [text, regex])

  if (!regex) {
    return <>{text}</>
  }

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-cyan-400/30 text-cyan-200 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
})
HighlightText.displayName = 'HighlightText'

/**
 * 单个歌曲项组件 - 使用 memo 优化
 */
const SongItem = memo(({
  item,
  index,
  isPlaying,
  isLiked,
  onPlay,
  onLike,
  isFocused,
  onFocus,
  searchTerm
}: SongItemProps) => {
  const decodedUrl = useMemo(() => decodeURIComponent(item.url), [item.url])
  const [isHeartBeating, setIsHeartBeating] = useState(false)

  // 收藏按钮点击 - 触发心跳动画
  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isLiked) {
      setIsHeartBeating(true)
      setTimeout(() => setIsHeartBeating(false), 800)
    }
    onLike(item.url)
  }, [isLiked, onLike, item.url])

  // 播放点击
  const handlePlay = useCallback(() => {
    onPlay(decodedUrl)
  }, [onPlay, decodedUrl])

  // 键盘事件处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onPlay(decodedUrl)
    }
  }, [onPlay, decodedUrl])

  return (
    <li
      role="option"
      aria-selected={isPlaying}
      tabIndex={isFocused ? 0 : -1}
      onFocus={onFocus}
      onKeyDown={handleKeyDown}
      className={`
        group relative flex items-center justify-between gap-4 p-3 rounded-xl cursor-pointer
        border border-transparent
        ${isPlaying
          ? 'bg-white/10 border-white/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
          : isFocused
            ? 'bg-white/[0.08] border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.08)]'
            : 'hover:bg-white/5 hover:border-white/5'
        }
        ${item.null ? 'opacity-40 pointer-events-none grayscale' : ''}
      `}
      onClick={handlePlay}
    >
      {/* 播放指示条 */}
      {isPlaying && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse" />
      )}

      {/* 聚焦指示器 */}
      {isFocused && !isPlaying && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400/50 rounded-r-full transition-opacity" />
      )}

      <div className="flex-1 flex items-center gap-4 overflow-hidden pl-2">
        <span
          className={`
            font-mono w-6 text-center text-xs select-none
            ${isPlaying ? 'text-cyan-400' : isFocused ? 'text-cyan-300/70' : 'text-white/20 group-hover:text-white/40'}
          `}
          aria-label={`曲目 ${index + 1}`}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex flex-col overflow-hidden">
          <span
            className={`
              font-body truncate text-sm font-medium
              ${isPlaying ? 'text-cyan-300' : isFocused ? 'text-white/90' : 'text-white/80 group-hover:text-white'}
            `}
          >
            <HighlightText text={item.title} searchTerm={searchTerm} />
          </span>
          <span
            className={`
              font-body truncate text-xs
              ${isFocused ? 'text-white/50' : 'text-white/40 group-hover:text-white/60'}
            `}
          >
            <HighlightText text={item.singer} searchTerm={searchTerm} />
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* 播放动画指示器 */}
        {isPlaying && (
          <div className="flex gap-[2px] items-end h-3" aria-label="正在播放">
            <div className="w-0.5 bg-cyan-400 animate-[bounce_0.6s_infinite]" style={{ height: '40%' }} />
            <div className="w-0.5 bg-cyan-400 animate-[bounce_0.8s_infinite_0.1s]" style={{ height: '70%' }} />
            <div className="w-0.5 bg-cyan-400 animate-[bounce_0.5s_infinite_0.2s]" style={{ height: '100%' }} />
          </div>
        )}

        {/* 收藏按钮 */}
        <button
          onClick={handleLike}
          className={`
            p-2 rounded-full active:scale-90 hover:bg-white/10
            focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50
            ${isLiked ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]' : 'text-white/20 hover:text-white/60'}
            ${isHeartBeating ? 'animate-heart-beat' : ''}
          `}
          aria-label={isLiked ? `取消喜欢 ${item.title}` : `喜欢 ${item.title}`}
          aria-pressed={isLiked}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={isLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>
    </li>
  )
})
SongItem.displayName = 'SongItem'

interface SongListProps {
  songs: Song[]
  currentUrl: string
  onPlay: (url: string) => void
  onLike: (url: string) => void
  likedSongs: Set<string>
  searchTerm?: string
}

/**
 * 歌曲列表组件
 * 使用虚拟化技术优化大列表性能
 */
export default function SongList({
  songs,
  currentUrl,
  onPlay,
  onLike,
  likedSongs,
  searchTerm = ''
}: SongListProps) {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const listRef = useRef<HTMLDivElement>(null)

  // 滚动状态追踪（用于优化快速滚动）
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 找到当前播放歌曲的索引
  const currentPlayingIndex = useMemo(() => {
    return songs.findIndex(item => decodeURIComponent(item.url) === currentUrl)
  }, [songs, currentUrl])

  // 虚拟化配置 - 优化滚动性能
  const virtualizer = useVirtualizer({
    count: songs.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 56,
    overscan: 3, // 减少 overscan 以优化快速滚动
  })

  // 滚动事件处理
  const handleScroll = useCallback(() => {
    isScrollingRef.current = true
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false
    }, 150)
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // 虚拟化后的项目
  const virtualItems = virtualizer.getVirtualItems()

  // 键盘导航
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => {
          const next = Math.min(prev + 1, songs.length - 1)
          virtualizer.scrollToIndex(next, { align: 'auto' })
          return next
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => {
          const next = Math.max(prev - 1, 0)
          virtualizer.scrollToIndex(next, { align: 'auto' })
          return next
        })
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < songs.length) {
          onPlay(decodeURIComponent(songs[focusedIndex].url))
        }
        break
      case 'Escape':
        setFocusedIndex(-1)
        break
    }
  }, [songs, focusedIndex, onPlay, virtualizer])

  // 当歌曲列表变化时，重置聚焦索引
  useEffect(() => {
    setFocusedIndex(-1)
  }, [songs])

  // 跳转到当前播放歌曲
  useEffect(() => {
    if (currentPlayingIndex >= 0) {
      virtualizer.scrollToIndex(currentPlayingIndex, { align: 'center', behavior: 'smooth' })
    }
  }, [currentPlayingIndex, virtualizer])

  return (
    <div className="w-full h-full flex flex-col">
      {/* 列表头部 */}
      <div className="flex justify-between items-center px-2 py-4 text-white/40 text-xs font-medium tracking-widest uppercase border-b border-white/5">
        <span className="font-display text-sm tracking-[0.2em]">Track List</span>
        <span className="font-mono tabular-nums" aria-live="polite">
          {songs.length} {songs.length === 1 ? 'Song' : 'Songs'}
        </span>
      </div>

      {/* 虚拟化歌曲列表 */}
      <div
        ref={listRef}
        role="listbox"
        aria-label="歌曲列表"
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20 pr-2 mt-2 focus:outline-none"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        onScroll={handleScroll}
      >
        {songs.length > 0 && (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualItem) => {
              const item = songs[virtualItem.index]
              const decodedUrl = decodeURIComponent(item.url)
              const isPlaying = decodedUrl === currentUrl
              const isLiked = likedSongs.has(decodedUrl)

              return (
                <div
                  key={decodedUrl}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <SongItem
                    item={item}
                    index={virtualItem.index}
                    isPlaying={isPlaying}
                    isLiked={isLiked}
                    onPlay={onPlay}
                    onLike={onLike}
                    isFocused={focusedIndex === virtualItem.index}
                    onFocus={() => setFocusedIndex(virtualItem.index)}
                    searchTerm={searchTerm}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* 空状态 */}
        {songs.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-16 text-white/30"
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
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
            <p className="text-sm font-medium mb-2">未找到匹配的歌曲</p>
            <p className="text-xs text-white/20">尝试调整搜索关键词</p>
          </div>
        )}
      </div>
    </div>
  )
}
