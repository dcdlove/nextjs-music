'use client'
import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null)

  const [audioUrl, setAudioUrl] = useState<string>('https://cdn.jsdelivr.net/gh/dcdlove/nextjs-music@main/public/%E4%B8%83%E5%85%AC%E4%B8%BB-%E6%96%BD%E5%B1%95%E5%92%92%E8%AF%AD.lkmp3')
  const [playlist, setPlaylist] = useState<{ singer: string; title: string; ext: string; url: string }[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isShuffle, setIsShuffle] = useState<boolean>(false)

  // 获取歌单数据
  const getMusicData = async () => {
    const res = await fetch('./data.json')
    const data = await res.json()
    const list = data.rows.map((n: { singer: string; title: string; ext: string }) => ({
      ...n,
      url: encodeURIComponent(`https://cdn.jsdelivr.net/gh/dcdlove/past@main/music/${n.singer}-${n.title}${n.ext}`)
    }))
    setPlaylist(list)
  }

  // 处理播放结束后的逻辑
  const handleEnded = () => {
    const currentIndex = playlist.findIndex(item => decodeURIComponent(item.url) === audioUrl)

    if (playlist.length === 0) return

    if (isShuffle) {
      const availableIndexes = playlist.map((_, i) => i).filter(i => i !== currentIndex)
      const randomIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)]
      setAudioUrl(decodeURIComponent(playlist[randomIndex].url))
    } else {
      const nextIndex = (currentIndex + 1) % playlist.length
      setAudioUrl(decodeURIComponent(playlist[nextIndex].url))
    }
  }

  useEffect(() => {
    getMusicData()
  }, [])

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play().catch(err => {
        console.error('播放失败：', err)
      })
    }
  }, [audioUrl])

  const currentTrack = playlist.find(item => decodeURIComponent(item.url) === audioUrl)

  const filteredList = playlist.filter(item => {
    const keyword = searchTerm.toLowerCase()
    return (
      item.title.toLowerCase().includes(keyword) ||
      item.singer.toLowerCase().includes(keyword)
    )
  })

  return (
    <div className="max-w-xl mx-auto p-4 text-gray-800 font-sans">
      <h1 className="text-xl font-bold mb-3 text-center">🎵 简约音乐播放器</h1>

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
        className="w-full mb-4 rounded shadow"
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

        <button
          onClick={() => setIsShuffle(prev => !prev)}
          className={`px-3 py-2 text-sm rounded border mt-1 sm:mt-0 transition ${
            isShuffle
              ? 'bg-blue-500 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          {isShuffle ? '🔀 随机播放中' : '🎵 顺序播放'}
        </button>
      </div>

      <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
        <span>播放列表</span>
        <span>共 {filteredList.length} 首</span>
      </div>

      <ul className="bg-white rounded shadow divide-y max-h-[500px] overflow-y-auto">
        {filteredList.map((item, index) => {
          const decodedUrl = decodeURIComponent(item.url)
          const isPlaying = decodedUrl === audioUrl
          return (
            <li
              key={index}
              onClick={() => setAudioUrl(decodedUrl)}
              className={`flex items-center gap-2 p-3 cursor-pointer transition ${
                isPlaying ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-50'
              }`}
            >
              <span className="w-6 text-right text-gray-500">{index + 1}.</span>
              <span>{isPlaying ? '🔊' : '🎵'}</span>
              <span className="truncate">{item.singer} - {item.title}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
