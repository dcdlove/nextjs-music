'use client'
import { useEffect, useMemo, useCallback, useRef, useState } from 'react'
import Header from './components/Header'
import Player from './components/Player'
import Controls from './components/Controls'
import SongList from './components/SongList'
import SingerList from './components/SingerList'
import DynamicBackground from './components/DynamicBackground'
import { AudioErrorBoundary } from './components/ErrorBoundary'
import { useStore, shuffleArray } from './store'

/**
 * 自定义 Hook：键盘快捷键
 */
function useKeyboardShortcuts(handlers: Record<string, () => void>, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略在输入框中的按键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const key = e.key.toLowerCase()
      const handler = handlers[key]

      if (handler) {
        e.preventDefault()
        handler()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers, enabled])
}

/**
 * 自定义 Hook：焦点管理
 */
function useFocusTrap(isOpen: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // 保存当前焦点
      previousFocusRef.current = document.activeElement as HTMLElement

      // 聚焦到容器
      setTimeout(() => {
        const container = containerRef.current
        if (container) {
          const firstFocusable = container.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          firstFocusable?.focus()
        }
      }, 100)
    } else {
      // 恢复焦点
      previousFocusRef.current?.focus()
    }
  }, [isOpen, containerRef])
}

export default function Home() {
  // 从 store 获取状态和 actions
  const {
    audioUrl,
    isPlaying,
    isPlaylistOpen,
    isSingerListOpen,
    playlist,
    randomList,
    isLoading,
    error,
    searchTerm,
    sortMode,
    likedSongs,
    themeColor,
    // Actions
    setIsPlaying,
    togglePlaylist,
    toggleSingerList,
    fetchPlaylist,
    setSearchTerm,
    setSortMode,
    toggleLike,
    setRandomList,
    playNext,
    playPrev,
  } = useStore()

  // 抽屉容器 refs
  const playlistDrawerRef = useRef<HTMLDivElement>(null)
  const singerListDrawerRef = useRef<HTMLDivElement>(null)

  // 歌手列表搜索状态
  const [singerSearchTerm, setSingerSearchTerm] = useState('')

  // 创建 audioDataRef 供 DynamicBackground 使用
  // 注意：audioData 现在由 Player 组件内部管理，通过 ref 传递
  const audioDataRef = useRef({ intensity: 0, bass: 0, high: 0 })

  // 焦点管理
  useFocusTrap(isPlaylistOpen, playlistDrawerRef)
  useFocusTrap(isSingerListOpen, singerListDrawerRef)

  // 初始化：加载播放列表
  useEffect(() => {
    fetchPlaylist()
  }, [fetchPlaylist])

  // 设置默认曲目（黄霄雲 - 光之黎明）
  const setDefaultTrack = useCallback(() => {
    const defaultSinger = '黄霄雲'
    const defaultTitle = '光之黎明'
    const defaultSong = playlist.find(
      item => item.singer === defaultSinger && item.title === defaultTitle
    )
    if (defaultSong) {
      useStore.getState().setAudioUrl(decodeURIComponent(defaultSong.url))
    } else if (playlist.length > 0) {
      // 如果找不到默认歌曲，使用第一首
      useStore.getState().setAudioUrl(decodeURIComponent(playlist[0].url))
    }
  }, [playlist])

  // 当 playlist 加载完成且 audioUrl 为空时，设置默认曲目
  useEffect(() => {
    if (playlist.length > 0 && !audioUrl) {
      setDefaultTrack()
    }
  }, [playlist, audioUrl, setDefaultTrack])

  // 过滤后的列表
  const filteredList = useMemo(() => {
    const keyword = searchTerm.toLowerCase()
    return playlist.filter(item =>
      item.title.toLowerCase().includes(keyword) || item.singer.toLowerCase().includes(keyword)
    )
  }, [playlist, searchTerm])

  // 随机列表逻辑
  useEffect(() => {
    if (sortMode === 'random') {
      setRandomList(shuffleArray(filteredList))
    } else {
      setRandomList([])
    }
  }, [sortMode, filteredList, setRandomList])

  // 排序后的列表
  const sortedList = useMemo(() => {
    if (sortMode === 'random') return randomList

    let list = [...filteredList]
    if (sortMode === 'liked') {
      list = list.filter(song => likedSongs.includes(decodeURIComponent(song.url)))
    }
    return list
  }, [sortMode, filteredList, randomList, likedSongs])

  // 当前曲目 - 通过解码后的 URL 匹配
  const currentTrack = useMemo(() => {
    if (!playlist.length || !audioUrl) return undefined
    return playlist.find(item => decodeURIComponent(item.url) === audioUrl)
  }, [playlist, audioUrl])

  // 播放指定曲目
  const playTrack = useCallback((url: string) => {
    useStore.getState().setAudioUrl(decodeURIComponent(url))
    useStore.getState().setIsPlaying(true)
  }, [])

  // 导航逻辑
  const handleNext = useCallback(() => {
    playNext()
  }, [playNext])

  const handlePrev = useCallback(() => {
    playPrev()
  }, [playPrev])

  // 点击歌手名：搜索该歌手并打开播放列表（同时关闭歌手列表）
  const handleSingerClick = useCallback((singer: string) => {
    setSearchTerm(singer)
    // 关闭歌手列表
    if (isSingerListOpen) {
      toggleSingerList()
    }
    // 打开播放列表
    if (!isPlaylistOpen) {
      togglePlaylist()
    }
  }, [setSearchTerm, isPlaylistOpen, isSingerListOpen, togglePlaylist, toggleSingerList])

  // ESC 键关闭抽屉
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPlaylistOpen) {
          togglePlaylist()
        }
        if (isSingerListOpen) {
          toggleSingerList()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaylistOpen, isSingerListOpen, togglePlaylist, toggleSingerList])

  // 全局键盘快捷键
  useKeyboardShortcuts({
    // 空格：播放/暂停
    ' ': () => setIsPlaying(!isPlaying),
    // 左箭头：上一曲
    'arrowleft': handlePrev,
    // 右箭头：下一曲
    'arrowright': handleNext,
    // P：切换播放列表
    'p': togglePlaylist,
    // S：切换歌手列表
    's': toggleSingerList,
    // /：聚焦搜索（在播放列表中）
    '/': () => {
      if (!isPlaylistOpen) togglePlaylist()
      setTimeout(() => {
        const searchInput = playlistDrawerRef.current?.querySelector<HTMLInputElement>('input[type="text"]')
        searchInput?.focus()
      }, 100)
    },
  }, !(isPlaylistOpen || isSingerListOpen))

  return (
    <>
      {/* 动态背景 - 放在最外层，完全铺满页面 */}
      <DynamicBackground
        isPlaying={isPlaying}
        audioDataRef={audioDataRef}
        vinylPosition={{ x: 50, y: 45 }}
        themeColor={themeColor ?? undefined}
      />

      <div className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto pb-24 relative animate-enter-bg">
        {/* Header - 0.2s 延迟 */}
      <div className="animate-enter-bottom delay-200">
        <Header />
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            <div className="text-white/80 text-sm animate-pulse">加载中...</div>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-xl z-50 animate-enter-bottom shadow-lg shadow-red-500/20 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Player - 0.4s 延迟 */}
      <div className="sticky top-4 z-30 mb-8 animate-vinyl-enter delay-400">
        <AudioErrorBoundary>
          <Player
            currentTrack={currentTrack}
            audioUrl={audioUrl}
            onEnded={handleNext}
            onNext={handleNext}
            onPrev={handlePrev}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            onTogglePlaylist={togglePlaylist}
            isPlaylistOpen={isPlaylistOpen}
            onSingerClick={handleSingerClick}
            onToggleSingerList={toggleSingerList}
            isSingerListOpen={isSingerListOpen}
            audioDataRef={audioDataRef}
          />
        </AudioErrorBoundary>
      </div>

      {/* 键盘快捷键提示 */}
      <div className="fixed bottom-4 left-4 hidden lg:flex items-center gap-2 text-white/20 text-xs z-20">
        <kbd className="px-2 py-1 bg-white/5 rounded border border-white/10">Space</kbd>
        <span>播放</span>
        <kbd className="px-2 py-1 bg-white/5 rounded border border-white/10 ml-2">←/→</kbd>
        <span>切换</span>
        <kbd className="px-2 py-1 bg-white/5 rounded border border-white/10 ml-2">P</kbd>
        <span>列表</span>
        <kbd className="px-2 py-1 bg-white/5 rounded border border-white/10 ml-2">S</kbd>
        <span>歌手</span>
      </div>

      {/* 播放列表抽屉 */}
      <div
        ref={playlistDrawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="播放列表"
        className={`
          fixed inset-y-0 right-0 w-full sm:w-[400px]
          bg-[#0f172a]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-40
          transform transition-all duration-500 ease-out
          ${isPlaylistOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none'}
        `}
      >
        <div className="h-full flex flex-col p-6 overflow-hidden">
          {/* 头部 */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h2 className="font-display text-xl text-white">播放列表</h2>
            </div>
            <button
              onClick={togglePlaylist}
              aria-label="关闭播放列表"
              className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-all active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 控制栏 */}
          <Controls
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortMode={sortMode}
            setSortMode={setSortMode}
          />

          {/* 歌曲列表 */}
          <div className="flex-1 overflow-hidden mt-4">
            <SongList
              songs={sortedList}
              currentUrl={audioUrl}
              onPlay={playTrack}
              onLike={toggleLike}
              likedSongs={new Set(likedSongs)}
              searchTerm={searchTerm}
            />
          </div>
        </div>
      </div>

      {/* 歌手列表抽屉 - 从左侧滑出 */}
      <div
        ref={singerListDrawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="歌手列表"
        className={`
          fixed inset-y-0 left-0 w-full sm:w-[400px]
          bg-[#0f172a]/95 backdrop-blur-xl border-r border-white/10 shadow-2xl z-40
          transform transition-all duration-500 ease-out
          ${isSingerListOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-full opacity-0 pointer-events-none'}
        `}
      >
        <div className="h-full flex flex-col p-6 overflow-hidden">
          {/* 头部 */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400/20 to-pink-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="font-display text-xl text-white">歌手列表</h2>
            </div>
            <button
              onClick={toggleSingerList}
              aria-label="关闭歌手列表"
              className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-all active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 歌手统计信息 */}
          <div className="mb-4 px-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                  <span className="text-cyan-400 font-bold text-sm tabular-nums">
                    {new Set(playlist.map(s => s.singer)).size}
                  </span>
                </div>
                <span className="text-white/60 text-sm">位歌手</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-400/10 flex items-center justify-center">
                  <span className="text-purple-400 font-bold text-sm tabular-nums">
                    {playlist.length}
                  </span>
                </div>
                <span className="text-white/60 text-sm">首歌曲</span>
              </div>
            </div>
          </div>

          {/* 歌手列表 */}
          <div className="flex-1 overflow-hidden">
            <SingerList
              songs={playlist}
              currentSinger={currentTrack?.singer}
              onSingerClick={handleSingerClick}
              searchTerm={singerSearchTerm}
              onSearchChange={setSingerSearchTerm}
            />
          </div>
        </div>
      </div>

      {/* 移动端遮罩层 - 播放列表 */}
      {isPlaylistOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 backdrop-blur-sm transition-opacity sm:hidden"
          onClick={togglePlaylist}
          aria-hidden="true"
        />
      )}

      {/* 移动端遮罩层 - 歌手列表 */}
      {isSingerListOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 backdrop-blur-sm transition-opacity sm:hidden"
          onClick={toggleSingerList}
          aria-hidden="true"
        />
      )}

      {/* 底部版权 - 1.2s 延迟 */}
      <div className="mt-12 text-center text-white/20 text-xs font-mono tracking-widest animate-enter-bottom delay-1200">
        SERENDIPITY MUSIC PLAYER • NEXT.JS • BY DCDLOVE
      </div>
    </div>
    </>
  )
}
