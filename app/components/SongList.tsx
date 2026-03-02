import React, { memo, useState, useCallback, useRef, useEffect, useMemo } from 'react'
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
 * 高亮搜索关键词
 */
const HighlightText = memo(({ text, searchTerm }: { text: string; searchTerm: string }) => {
  if (!searchTerm.trim()) {
    return <>{text}</>
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-cyan-400/30 text-cyan-200 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
})
HighlightText.displayName = 'HighlightText'

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
  const decodedUrl = decodeURIComponent(item.url)
  const [isHeartBeating, setIsHeartBeating] = useState(false)
  const itemRef = useRef<HTMLLIElement>(null)

  // 当聚焦时滚动到可视区域
  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isFocused])

  // 收藏按钮点击 - 触发心跳动画
  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isLiked) {
      setIsHeartBeating(true)
      setTimeout(() => setIsHeartBeating(false), 800)
    }
    onLike(item.url)
  }, [isLiked, onLike, item.url])

  // 键盘事件处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onPlay(decodedUrl)
    }
  }, [onPlay, decodedUrl])

  return (
    <li
      ref={itemRef}
      role="option"
      aria-selected={isPlaying}
      tabIndex={isFocused ? 0 : -1}
      onFocus={onFocus}
      onKeyDown={handleKeyDown}
      className={`
        group relative flex items-center justify-between gap-4 p-3 rounded-xl cursor-pointer
        transition-all duration-300 border border-transparent
        ${isPlaying
          ? 'bg-white/10 border-white/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
          : isFocused
            ? 'bg-white/[0.08] border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.08)]'
            : 'hover:bg-white/5 hover:border-white/5 hover:-translate-y-0.5 hover:shadow-lg'
        }
        ${item.null ? 'opacity-40 pointer-events-none grayscale' : ''}
      `}
      onClick={() => onPlay(decodedUrl)}
      style={{
        animation: `fadeInUp 0.3s ease-out ${index * 0.02}s both`
      }}
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
            font-mono w-6 text-center text-xs transition-colors select-none
            ${isPlaying ? 'text-cyan-400' : isFocused ? 'text-cyan-300/70' : 'text-white/20 group-hover:text-white/40'}
          `}
          aria-label={`曲目 ${index + 1}`}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex flex-col overflow-hidden">
          <span
            className={`
              font-body truncate text-sm font-medium transition-colors
              ${isPlaying ? 'text-cyan-300' : isFocused ? 'text-white/90' : 'text-white/80 group-hover:text-white'}
            `}
          >
            <HighlightText text={item.title} searchTerm={searchTerm} />
          </span>
          <span
            className={`
              font-body truncate text-xs transition-colors
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
            p-2 rounded-full transition-all active:scale-90 hover:bg-white/10
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

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
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
 * 支持键盘导航、搜索高亮、无障碍访问
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
  const listRef = useRef<HTMLUListElement>(null)

  // 找到当前播放歌曲的索引
  const currentPlayingIndex = useMemo(() => {
    return songs.findIndex(item => decodeURIComponent(item.url) === currentUrl)
  }, [songs, currentUrl])

  // 键盘导航
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, songs.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, 0))
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
  }, [songs, focusedIndex, onPlay])

  // 当歌曲列表变化时，重置聚焦索引
  useEffect(() => {
    setFocusedIndex(-1)
  }, [songs])

  // 当前列表为空时跳转到当前播放歌曲
  useEffect(() => {
    if (currentPlayingIndex >= 0 && listRef.current) {
      const item = listRef.current.children[currentPlayingIndex] as HTMLElement
      item?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [currentPlayingIndex])

  return (
    <div className="w-full h-full flex flex-col">
      {/* 列表头部 */}
      <div className="flex justify-between items-center px-2 py-4 text-white/40 text-xs font-medium tracking-widest uppercase border-b border-white/5">
        <span className="font-display text-sm tracking-[0.2em]">Track List</span>
        <span className="font-mono tabular-nums" aria-live="polite">
          {songs.length} {songs.length === 1 ? 'Song' : 'Songs'}
        </span>
      </div>

      {/* 歌曲列表 */}
      <ul
        ref={listRef}
        role="listbox"
        aria-label="歌曲列表"
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20 pr-2 space-y-1 mt-2 focus:outline-none"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {songs.map((item, index) => {
          const decodedUrl = decodeURIComponent(item.url)
          const isPlaying = decodedUrl === currentUrl
          const isLiked = likedSongs.has(decodedUrl)

          return (
            <SongItem
              key={decodedUrl}
              item={item}
              index={index}
              isPlaying={isPlaying}
              isLiked={isLiked}
              onPlay={onPlay}
              onLike={onLike}
              isFocused={focusedIndex === index}
              onFocus={() => setFocusedIndex(index)}
              searchTerm={searchTerm}
            />
          )
        })}
      </ul>

      {/* 空状态 */}
      {songs.length === 0 && (
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
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <p className="text-sm font-medium mb-2">未找到匹配的歌曲</p>
          <p className="text-xs text-white/20">尝试调整搜索关键词</p>
        </div>
      )}
    </div>
  )
}
