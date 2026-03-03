import React, { useState, useCallback, useRef, useEffect, memo } from 'react'
import { SortMode } from '../types'

interface ControlsProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  sortMode: SortMode
  setSortMode: (mode: SortMode) => void
}

/**
 * 防抖 Hook
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

/**
 * 排序模式配置
 */
const SORT_MODES: Array<{ mode: SortMode; label: string; icon: React.ReactNode; description: string }> = [
  {
    mode: 'default',
    label: 'Default',
    description: '按原始顺序排列',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    )
  },
  {
    mode: 'liked',
    label: 'Liked',
    description: '只显示喜欢的歌曲',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    )
  }
]

/**
 * 播放列表控制组件
 * 支持搜索、排序模式切换、无障碍访问
 */
function ControlsComponent({ searchTerm, setSearchTerm, sortMode, setSortMode }: ControlsProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 同步外部搜索词
  useEffect(() => {
    setLocalSearchTerm(searchTerm)
  }, [searchTerm])

  // 搜索输入变化（即时更新本地状态）
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value)
  }, [])

  // 防抖后更新外部状态
  const debouncedSearchTerm = useDebounce(localSearchTerm, 300)
  useEffect(() => {
    setSearchTerm(debouncedSearchTerm)
  }, [debouncedSearchTerm, setSearchTerm])

  // 清除搜索
  const handleClearSearch = useCallback(() => {
    setLocalSearchTerm('')
    setSearchTerm('')
    inputRef.current?.focus()
  }, [setSearchTerm])

  // 键盘快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && localSearchTerm) {
      handleClearSearch()
    }
  }, [localSearchTerm, handleClearSearch])

  return (
    <div className="flex flex-col gap-5 mb-2">
      {/* 搜索框 */}
      <div className={`relative group transition-all duration-300 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
        {/* 搜索图标 */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg
            className={`h-4 w-4 transition-all duration-300 ${isSearchFocused || localSearchTerm ? 'text-cyan-400 scale-110' : 'text-white/40 group-focus-within:text-cyan-400'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* 输入框 */}
        <input
          ref={inputRef}
          type="text"
          placeholder="搜索歌曲或歌手..."
          value={localSearchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          onKeyDown={handleKeyDown}
          aria-label="搜索歌曲"
          className={`
            font-body w-full pl-11 pr-10 py-3
            bg-white/5 border rounded-2xl text-white placeholder-white/20
            focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:bg-white/10
            transition-all backdrop-blur-md text-sm font-medium tracking-wide
            ${isSearchFocused ? 'border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.1)]' : 'border-white/10'}
          `}
        />

        {/* 清除按钮 */}
        {localSearchTerm && (
          <button
            onClick={handleClearSearch}
            aria-label="清除搜索"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* 搜索中指示器 */}
        {localSearchTerm !== debouncedSearchTerm && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* 排序模式切换 */}
      <div className="flex items-center justify-between bg-black/20 p-1.5 rounded-2xl backdrop-blur-md border border-white/5">
        {SORT_MODES.map(({ mode, label, icon, description }) => {
          const isActive = sortMode === mode
          return (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              aria-label={description}
              aria-pressed={isActive}
              className={`
                font-body flex-1 py-2.5 px-3 rounded-xl
                text-xs font-bold uppercase tracking-wider
                transition-all duration-300
                flex items-center justify-center gap-2
                focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50
                ${isActive
                  ? 'bg-white/10 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.1)] border border-white/10'
                  : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                {icon}
              </span>
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const Controls = memo(ControlsComponent)
Controls.displayName = 'Controls'

export default Controls
