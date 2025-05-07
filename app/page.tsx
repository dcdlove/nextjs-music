'use client'
import { useState } from "react"

export default function Home() {

  //请求文件流转换成提供给给audio标签播放的url
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const handleClick = async () => {
    const response = await fetch("http://localhost:3000/%E4%B8%83%E5%85%AC%E4%B8%BB-%E6%96%BD%E5%B1%95%E5%92%92%E8%AF%AD.lkmp3", {
      method: "GET",
      headers: {
        "Content-Type": "audio/mpeg",
      },
    })
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    setAudioUrl(url)
    //自动播放
    const audio = document.querySelector("audio")
    if (audio) {
      audio.play()
    }
    //释放url对象
    return () => {
      URL.revokeObjectURL(url)
    }
  }


  return (
    <div>
      <button onClick={handleClick} className="cursor-pointer">加载音乐</button>
      <audio controls src={audioUrl ? audioUrl : undefined}></audio>
       
    </div>
  )
}
