'use client'
import { useEffect, useMemo, useCallback } from 'react'
import Header from './components/Header'
import Player from './components/Player'
import Controls from './components/Controls'
import SongList from './components/SongList'
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

  // 初始化：加载播放列表
  useEffect(() => {
    fetchPlaylist()
  }, [fetchPlaylist])

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

  // 当前曲目
  const currentTrack = useMemo(() => {
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
    <div className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto pb-24 relative">
      <Header />

      {/* 加载状态 */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="text-white animate-pulse">加载中...</div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg z-50">
          {error}
        </div>
      )}

      <div className="sticky top-4 z-30 mb-8">
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
        <div className="h-full flex flex-col p-6 overflow-hidden animate-[fadeIn_0.4s_ease-out_0.2s_both]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">播放列表</h2>
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
          className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm transition-opacity sm:hidden animate-[fadeIn_0.3s_ease-out]"
          onClick={togglePlaylist}
        />
      )}

      <div className="mt-12 text-center text-white/20 text-xs font-mono tracking-widest">
        SERENDIPITY MUSIC PLAYER • NEXT.JS • BY DCDLOVE
      </div>
    </div>
  )
}
