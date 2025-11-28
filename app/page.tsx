'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import Header from './components/Header'
import Player from './components/Player'
import Controls from './components/Controls'
import SongList from './components/SongList'
import { Song, SortMode } from './types'

export default function Home() {
  // State
  const [audioUrl, setAudioUrl] = useState<string>('/api/res2?name=%E4%B8%83%E5%85%AC%E4%B8%BB-%E7%A7%8B%E5%A4%A9%E5%A5%8F%E9%B8%A3%E6%9B%B2.lkmp3')
  const [playlist, setPlaylist] = useState<Song[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('小凌')
  const [sortMode, setSortMode] = useState<SortMode>('default')
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set())
  const [randomList, setRandomList] = useState<Song[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false)

  // Fetch Data
  useEffect(() => {
    const isPC = () => {
      const userAgentInfo = navigator.userAgent
      const Agents = ['Android', 'iPhone', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod']
      return !Agents.some(agent => userAgentInfo.includes(agent))
    }
    const isMobile = !isPC()

    const fetchData = async () => {
      try {
        const res = await fetch('./data.json')
        const data = await res.json()
        const list = data.rows.map((n: any) => ({
          ...n,
          url2: encodeURIComponent(`https://cdn.jsdelivr.net/gh/dcdlove/oss/music/${n.singer}-${n.title}.lk${n.ext.replace('.', '')}`),
          url: isMobile
            ? `/api/res2?name=${encodeURIComponent(encodeURIComponent(n.singer))}-${encodeURIComponent(encodeURIComponent(n.title))}.lk${n.ext.replace('.', '')}`
            : encodeURIComponent(`https://cdn.jsdelivr.net/gh/dcdlove/oss/music/${n.singer}-${n.title}.lk${n.ext.replace('.', '')}`),
        }))
        setPlaylist(list)
      } catch (error) {
        console.error("Failed to fetch data", error)
      }
    }

    fetchData()
  }, [])

  // Load Liked Songs
  useEffect(() => {
    const stored = localStorage.getItem('likedSongs')
    if (stored) {
      setLikedSongs(new Set(JSON.parse(stored)))
    }
  }, [])

  // Toggle Like
  const toggleLike = useCallback((url: string) => {
    const decodedUrl = decodeURIComponent(url)
    setLikedSongs(prev => {
      const updated = new Set(prev)
      if (updated.has(decodedUrl)) {
        updated.delete(decodedUrl)
      } else {
        updated.add(decodedUrl)
      }
      localStorage.setItem('likedSongs', JSON.stringify(Array.from(updated)))
      return updated
    })
  }, [])

  // Filtered List
  const filteredList = useMemo(() => {
    const keyword = searchTerm.toLowerCase()
    return playlist.filter(item =>
      item.title.toLowerCase().includes(keyword) || item.singer.toLowerCase().includes(keyword)
    )
  }, [playlist, searchTerm])

  // Random List Logic
  useEffect(() => {
    if (sortMode === 'random') {
      const listToShuffle = [...filteredList]
      for (let i = listToShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
          ;[listToShuffle[i], listToShuffle[j]] = [listToShuffle[j], listToShuffle[i]]
      }
      setRandomList(listToShuffle)
    } else {
      setRandomList([])
    }
  }, [sortMode, filteredList])

  // Sorted List
  const sortedList = useMemo(() => {
    if (sortMode === 'random') return randomList

    let list = [...filteredList]
    if (sortMode === 'liked') {
      list.sort((a, b) => {
        const aLiked = likedSongs.has(decodeURIComponent(a.url)) ? -1 : 1
        const bLiked = likedSongs.has(decodeURIComponent(b.url)) ? -1 : 1
        return aLiked - bLiked
      })
    }
    return list
  }, [sortMode, filteredList, randomList, likedSongs])

  // Navigation Logic
  const playTrack = useCallback((url: string) => {
    setAudioUrl(url)
    setIsPlaying(true)
  }, [])

  const handleNext = useCallback(() => {
    if (playlist.length === 0) return
    const currentList = sortMode === 'random' ? randomList : playlist
    const listToUse = currentList.length > 0 ? currentList : playlist

    const currentIndex = listToUse.findIndex(item => decodeURIComponent(item.url) === audioUrl)
    const nextIndex = (currentIndex + 1) % listToUse.length
    playTrack(decodeURIComponent(listToUse[nextIndex].url))
  }, [playlist, randomList, sortMode, audioUrl, playTrack])

  const handlePrev = useCallback(() => {
    if (playlist.length === 0) return
    const currentList = sortMode === 'random' ? randomList : playlist
    const listToUse = currentList.length > 0 ? currentList : playlist

    const currentIndex = listToUse.findIndex(item => decodeURIComponent(item.url) === audioUrl)
    const prevIndex = (currentIndex - 1 + listToUse.length) % listToUse.length
    playTrack(decodeURIComponent(listToUse[prevIndex].url))
  }, [playlist, randomList, sortMode, audioUrl, playTrack])

  const currentTrack = playlist.find(item => decodeURIComponent(item.url) === audioUrl)

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto pb-24 relative">
      <Header />

      <div className="sticky top-4 z-30 mb-8">
        <Player
          currentTrack={currentTrack}
          audioUrl={audioUrl}
          onEnded={handleNext}
          onNext={handleNext}
          onPrev={handlePrev}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          onTogglePlaylist={() => setIsPlaylistOpen(!isPlaylistOpen)}
          isPlaylistOpen={isPlaylistOpen}
        />
      </div>

      {/* Playlist Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#0f172a]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-40 transform transition-all duration-500 ease-out ${isPlaylistOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}
      >
        <div className="h-full flex flex-col p-6 overflow-hidden animate-[fadeIn_0.4s_ease-out_0.2s_both]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">播放列表</h2>
            <button
              onClick={() => setIsPlaylistOpen(false)}
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
              likedSongs={likedSongs}
            />
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isPlaylistOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm transition-opacity sm:hidden animate-[fadeIn_0.3s_ease-out]"
          onClick={() => setIsPlaylistOpen(false)}
        />
      )}

      <div className="mt-12 text-center text-white/20 text-xs font-mono tracking-widest">
        SERENDIPITY MUSIC PLAYER • NEXT.JS
      </div>
    </div>
  )
}
