'use client'
import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null)

  const [audioUrl, setAudioUrl] = useState<string>('/api/res2?name=%E4%B8%83%E5%85%AC%E4%B8%BB-%E7%A7%8B%E5%A4%A9%E5%A5%8F%E9%B8%A3%E6%9B%B2.lkmp3')
  const [playlist, setPlaylist] = useState<{ singer: string; title: string; ext: string; url: string; url2?: string; null?: boolean }[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('小凌')
  const [sortMode, setSortMode] = useState<'default' | 'random' | 'liked'>('default')
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set())

  // 用来存储进入随机模式时固定的播放顺序
  const [randomList, setRandomList] = useState<typeof playlist>([])

  // 判断当前是否为PC端
  const isPC = () => {
    const userAgentInfo = navigator.userAgent
    const Agents = ['Android', 'iPhone', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod']
    return !Agents.some(agent => userAgentInfo.includes(agent))
  }

  const isMobile = true //!isPC()

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('./data.json')
      const data = await res.json()
      const list = data.rows.map((n: { singer: string; title: string; ext: string }) => ({
        ...n,
        url2: encodeURIComponent(`https://cdn.jsdelivr.net/gh/dcdlove/oss/music/${n.singer}-${n.title}.lk${n.ext.replace('.', '')}`),
        url: isMobile? `/api/res2?name=${encodeURIComponent(encodeURIComponent(n.singer))}-${encodeURIComponent(encodeURIComponent(n.title))}.lk${n.ext.replace('.', '')}`:encodeURIComponent(`https://cdn.jsdelivr.net/gh/dcdlove/oss/music/${n.singer}-${n.title}.lk${n.ext.replace('.', '')}`),
      }))
      setPlaylist(list)
    }

    fetchData()
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('likedSongs')
    if (stored) {
      setLikedSongs(new Set(JSON.parse(stored)))
    }
  }, [])

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play().catch(err => {
        console.error('播放失败：', err)
      })
    }
  }, [audioUrl])

  const updateLocalStorage = (updatedSet: Set<string>) => {
    localStorage.setItem('likedSongs', JSON.stringify(Array.from(updatedSet)))
  }

  const toggleLike = (url: string) => {
    const decodedUrl = decodeURIComponent(url)
    const updated = new Set(likedSongs)
    if (updated.has(decodedUrl)) {
      updated.delete(decodedUrl)
    } else {
      updated.add(decodedUrl)
    }
    setLikedSongs(new Set(updated))
    updateLocalStorage(updated)
  }

  // 监听 sortMode，只在进入随机模式时打乱一次
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
  }, [sortMode, playlist, searchTerm, likedSongs])

  const handleEnded = () => {
    const currentIndex = playlist.findIndex(item => decodeURIComponent(item.url) === audioUrl)
    if (playlist.length === 0) return

    let nextIndex: number

    if (sortMode === 'random') {
      // 在随机模式下，使用 state 中的 randomList 来找当前索引
      const currentRandomIndex = randomList.findIndex(item => decodeURIComponent(item.url) === audioUrl)
      nextIndex = (currentRandomIndex + 1) % randomList.length
      setAudioUrl(decodeURIComponent(randomList[nextIndex].url))
      return
    }

    nextIndex = (currentIndex + 1) % playlist.length
    setAudioUrl(decodeURIComponent(playlist[nextIndex].url))
  }

  const currentTrack = playlist.find(item => decodeURIComponent(item.url) === audioUrl)

  const filteredList = playlist.filter(item => {
    const keyword = searchTerm.toLowerCase()
    return item.title.toLowerCase().includes(keyword) || item.singer.toLowerCase().includes(keyword)
  })

  const getSortedList = () => {
    if (sortMode === 'random') {
      return randomList
    }

    let list = [...filteredList]
    if (sortMode === 'liked') {
      list.sort((a, b) => {
        const aLiked = likedSongs.has(decodeURIComponent(a.url)) ? -1 : 1
        const bLiked = likedSongs.has(decodeURIComponent(b.url)) ? -1 : 1
        return aLiked - bLiked
      })
    }
    return list
  }

  const sortedList = getSortedList()

  return (
    <div className="max-w-xl mx-auto p-4 text-gray-800 font-sans">
      <h1 className="text-xl font-bold mb-3 text-center">🎵 我的云音乐</h1>
        
      {currentTrack && (
        <div className="mb-3 text-center">
          <p className="text-sm text-gray-500">正在播放：</p>
          <p className="text-lg font-semibold text-blue-600 truncate">{currentTrack.singer} - {currentTrack.title}</p>
        </div>
      )}

      

      <audio
        ref={audioRef}
        controls
        src={audioUrl}
        className="w-full mb-4 "
        onEnded={handleEnded}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <input
          type="text"
          placeholder="🔍 搜索歌手或歌名..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
        />
      </div>

      <div className="flex items-center gap-2 mb-3 text-sm">
        <span>排序：</span>
        {['default', 'random', 'liked'].map(mode => (
          <button
            key={mode}
            onClick={() => setSortMode(mode as typeof sortMode)}
            className={`px-2 py-1 rounded border ${
              sortMode === mode
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {mode === 'default' && '默认'}
            {mode === 'random' && '随机'}
            {mode === 'liked' && '喜欢'}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
        <span>播放列表</span>
        <span>共 {sortedList.length} 首</span>
      </div>

      <ul className="bg-white rounded shadow divide-y max-h-[500px] overflow-y-auto">
        {sortedList.map((item, index) => {
          const decodedUrl = decodeURIComponent(item.url)
          
          const isPlaying = decodedUrl === audioUrl
          const isLiked = likedSongs.has(decodedUrl)

          return (
            <li
              key={decodedUrl}
              className={`flex items-center justify-between gap-2 p-3 cursor-pointer transition ${
                isPlaying ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-50'
              } ${item.null ? 'text-red-400' : ''}`}
            >
              <div
                onClick={() => setAudioUrl(decodedUrl)}
                className="flex-1 flex items-center gap-2"
              >
                <span className="w-6 text-right text-gray-500">{index + 1}.</span>
                <span>{isPlaying ? '🔊' : '🎵'}</span>
                <span className="truncate">{item.singer} - {item.title}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleLike(item.url)
                }}
                className="text-xl"
                title={isLiked ? '取消喜欢' : '标记为喜欢'}
              >
                {isLiked ? '❤️' : '🤍'}
              </button>
            </li>
          )
        })}
      </ul>
       https://ghproxy.link 最新加速地址
    </div>
  )
}
