import React, { memo } from 'react'

/**
 * 歌曲信息组件 Props
 */
interface TrackInfoProps {
  /** 歌曲标题 */
  title?: string
  /** 歌手名 */
  singer?: string
  /** 主题渐变色 */
  gradient: string
  /** 播放列表按钮点击回调 */
  onTogglePlaylist: () => void
  /** 主题色 */
  primaryColor: string
}

/**
 * 歌曲信息组件
 * 显示歌曲标题、歌手名和播放列表按钮
 */
function TrackInfoComponent({
  title,
  singer,
  gradient,
  onTogglePlaylist,
  primaryColor
}: TrackInfoProps) {
  return (
    <div className="mt-12 flex flex-col items-center space-y-4 z-20 animate-[fadeIn_0.8s_ease-out_0.2s_both]">
      <div className="text-center space-y-2">
        <h2
          className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 tracking-tight drop-shadow-sm"
          style={{
            backgroundImage: gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))'
          }}
        >
          {title || '选择歌曲'}
        </h2>
        <p className="text-sm font-bold tracking-[0.2em] uppercase text-white/60">
          {singer || '...'}
        </p>
      </div>

      {/* 播放列表按钮 */}
      <button
        onClick={onTogglePlaylist}
        className="group relative px-6 py-2 rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
      >
        <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
        <div className="absolute inset-0 border border-white/10 rounded-full" />
        <span
          className="relative flex items-center gap-2 text-xs font-bold tracking-widest uppercase"
          style={{ color: primaryColor }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          播放列表
        </span>
      </button>
    </div>
  )
}

const TrackInfo = memo(TrackInfoComponent)
TrackInfo.displayName = 'TrackInfo'

export default TrackInfo
