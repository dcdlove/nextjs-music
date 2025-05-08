'use client'
import { useEffect, useRef, useState } from "react"

export default function Home() {

  const audioRef = useRef<HTMLAudioElement>(null)

  const [audioUrl, setAudioUrl] = useState<string>("https://cdn.jsdelivr.net/gh/dcdlove/nextjs-music@main/public/%E4%B8%83%E5%85%AC%E4%B8%BB-%E6%96%BD%E5%B1%95%E5%92%92%E8%AF%AD.lkmp3")

  const [playlist, setPlaylist] = useState<{ singer: string; title: string; ext: string, url: string }[]>([])

  // 获取请求数据
  const getMusicData = async () => {
    const res = await fetch("./data.json", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
    //处理响应json 对象

    const data = await res.json()
    const list = data.rows.map((n: { singer: string; title: string; ext: string, url: string }) => ({ ...n, url: encodeURIComponent(`https://cdn.jsdelivr.net/gh/dcdlove/past@main/music/${n.singer}-${n.title}${n.ext}`) }))
    setPlaylist(list)
    console.log(list)

  }
  const handleEnded = () => {
    const currentIndex = playlist.findIndex(item => decodeURIComponent(item.url) === audioUrl)
    const nextIndex = (currentIndex + 1) % playlist.length // 循环播放
    setAudioUrl(decodeURIComponent(playlist[nextIndex].url))
  }


  useEffect(() => {
    getMusicData()
  }, [])

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play().catch(err => {
        // 可选处理错误（如浏览器未允许自动播放）
        console.error('播放失败：', err)
      })
    }
  }, [audioUrl])

  return (
    <div className="max-w-xl mx-auto p-4">
      <audio
        ref={audioRef}
        controls
        src={audioUrl}
        className="w-full mb-4 rounded shadow"
        onEnded={handleEnded}
      />

      <ul className="bg-white rounded shadow divide-y max-h-[700px] overflow-y-auto">
        {
          playlist.map((item, index) => {
            const isPlaying = audioUrl === decodeURIComponent(item.url)
            return (
              <li
                key={index}
                onClick={() => setAudioUrl(decodeURIComponent(item.url))}
                className={`flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-100 transition ${isPlaying ? 'bg-blue-50 text-blue-600 font-semibold' : ''
                  }`}
              >
                {isPlaying ? '🔊' : '🎵'} {item.singer} - {item.title}
              </li>
            )
          })
        }
      </ul>
    </div>
  )


}
