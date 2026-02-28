import React, { memo, useMemo } from 'react'

/**
 * 歌手信息接口
 */
interface SingerInfo {
  /** 歌手名 */
  name: string
  /** 该歌手的歌曲数量 */
  songCount: number
  /** 该歌手的代表性歌曲（第一首） */
  representativeSong?: {
    title: string
    url: string
  }
}

/**
 * SingerList 组件 Props
 */
interface SingerListProps {
  /** 所有歌曲列表 */
  songs: Array<{ singer: string; title: string; url: string }>
  /** 当前播放的歌手 */
  currentSinger?: string
  /** 点击歌手回调 */
  onSingerClick: (singer: string) => void
}

/**
 * 从歌曲列表提取歌手信息
 */
function extractSingers(songs: Array<{ singer: string; title: string; url: string }>): SingerInfo[] {
  const singerMap = new Map<string, { count: number; songs: Array<{ title: string; url: string }> }>()

  songs.forEach(song => {
    const existing = singerMap.get(song.singer)
    if (existing) {
      existing.count++
      existing.songs.push({ title: song.title, url: song.url })
    } else {
      singerMap.set(song.singer, {
        count: 1,
        songs: [{ title: song.title, url: song.url }]
      })
    }
  })

  return Array.from(singerMap.entries())
    .map(([name, data]) => ({
      name,
      songCount: data.count,
      representativeSong: data.songs[0]
    }))
    .sort((a, b) => b.songCount - a.songCount) // 按歌曲数量降序
}

/**
 * 歌手列表组件
 * 展示所有歌手及其歌曲数量，点击可搜索该歌手的歌曲
 */
function SingerListComponent({
  songs,
  currentSinger,
  onSingerClick
}: SingerListProps) {
  // 提取歌手信息
  const singers = useMemo(() => extractSingers(songs), [songs])

  return (
    <div className="space-y-2 overflow-y-auto max-h-full pr-2 custom-scrollbar">
      {singers.map((singer, index) => {
        const isCurrentSinger = currentSinger === singer.name

        return (
          <button
            key={singer.name}
            onClick={() => onSingerClick(singer.name)}
            className={`
              w-full group relative flex items-center gap-4 p-4 rounded-2xl
              transition-all duration-300 text-left
              ${isCurrentSinger
                ? 'bg-white/10 border border-white/20 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                : 'bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/10'
              }
            `}
          >
            {/* 序号 */}
            <span className="w-6 text-xs font-mono text-white/30 group-hover:text-white/50 transition-colors">
              {String(index + 1).padStart(2, '0')}
            </span>

            {/* 歌手头像/图标 */}
            <div
              className={`
                w-12 h-12 rounded-full flex items-center justify-center
                transition-all duration-300
                ${isCurrentSinger
                  ? 'bg-gradient-to-br from-cyan-400/20 to-purple-500/20 ring-2 ring-cyan-400/30'
                  : 'bg-white/5 group-hover:bg-white/10'
                }
              `}
            >
              <svg
                className={`w-6 h-6 transition-colors ${isCurrentSinger ? 'text-cyan-400' : 'text-white/40 group-hover:text-white/60'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            {/* 歌手信息 */}
            <div className="flex-1 min-w-0">
              <p className={`font-bold truncate transition-colors ${isCurrentSinger ? 'text-cyan-300' : 'text-white/80 group-hover:text-white'}`}>
                {singer.name}
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                {singer.songCount} 首歌曲
              </p>
            </div>

            {/* 箭头指示 */}
            <svg
              className={`w-5 h-5 transition-all duration-300 ${isCurrentSinger ? 'text-cyan-400 opacity-100' : 'text-white/20 opacity-0 group-hover:opacity-100 group-hover:text-white/40 translate-x-0 group-hover:translate-x-1'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )
      })}

      {/* 空状态 */}
      {singers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-sm">暂无歌手</p>
        </div>
      )}
    </div>
  )
}

const SingerList = memo(SingerListComponent)
SingerList.displayName = 'SingerList'

export default SingerList
