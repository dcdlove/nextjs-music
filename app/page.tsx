'use client'
import { useEffect, useMemo, useCallback, useRef } from 'react'
import Header from './components/Header'
import Player from './components/Player'
import Controls from './components/Controls'
import SongList from './components/SongList'
import DynamicBackground from './components/DynamicBackground'
import { AudioErrorBoundary } from './components/ErrorBoundary'
import { useStore, shuffleArray } from './store'

export default function Home() {
  // 从 store 获取状态和 actions
  const {
    audioUrl,
    isPlaying,
    isPlaylistOpen,
    playlist,
    randomList,
    isLoading,
    error,
    searchTerm,
    sortMode,
    likedSongs,
    // 音频数据（用于 DynamicBackground）
    audioData,
    themeColor,
    // Actions
    setIsPlaying,
    togglePlaylist,
    fetchPlaylist,
    setSearchTerm,
    setSortMode,
    toggleLike,
    setRandomList,
    playNext,
    playPrev,
  } = useStore()

  // 创建 audioDataRef 供 DynamicBackground 使用
  const audioDataRef = useRef(audioData)

  // 同步 audioData 到 ref
  useEffect(() => {
    audioDataRef.current = audioData
  }, [audioData])

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
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="text-white animate-pulse">加载中...</div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg z-50 animate-enter-bottom">
          {error}
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
          />
        </AudioErrorBoundary>
      </div>

      {/* 播放列表抽屉 */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#0f172a]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-40 transform transition-all duration-500 ease-out ${
          isPlaylistOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div className="h-full flex flex-col p-6 overflow-hidden animate-enter-left delay-1000">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-xl text-white">播放列表</h2>
            <button
              onClick={togglePlaylist}
              className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors active:scale-90"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <Controls
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortMode={sortMode}
            setSortMode={setSortMode}
          />

          <div className="flex-1 overflow-hidden mt-4">
            <SongList
              songs={sortedList}
              currentUrl={audioUrl}
              onPlay={playTrack}
              onLike={toggleLike}
              likedSongs={new Set(likedSongs)}
            />
          </div>
        </div>
      </div>

      {/* 移动端遮罩层 */}
      {isPlaylistOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm transition-opacity sm:hidden animate-enter-bg"
          onClick={togglePlaylist}
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
