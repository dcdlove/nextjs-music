import React, { memo } from 'react'

/**
 * 播放控制组件 Props
 */
interface PlayerControlsProps {
  /** 是否正在播放 */
  isPlaying: boolean
  /** 播放/暂停回调 */
  onPlayPause: () => void
  /** 上一曲回调 */
  onPrev: () => void
  /** 下一曲回调 */
  onNext: () => void
  /** 响应式尺寸 */
  size: 'small' | 'large'
}

/**
 * 播放控制组件
 * 包含上一曲、播放/暂停、下一曲按钮
 */
function PlayerControlsComponent({
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
  size
}: PlayerControlsProps) {
  const iconSize = size === 'small' ? 'w-8 h-8' : 'w-10 h-10'
  const buttonSize = size === 'small' ? 'w-20 h-20' : 'w-24 sm:w-24 sm:h-24'
  const playIconSize = size === 'small' ? 'w-10 h-10' : 'w-10 h-10 sm:w-12 sm:h-12'
  const gap = size === 'small' ? 'gap-6' : 'gap-6 sm:gap-10'

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 transition-all duration-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:backdrop-blur-[2px]">
      <div className={`flex items-center ${gap} transform scale-100 sm:scale-90 sm:group-hover:scale-100 transition-transform duration-300`}>
        {/* 上一曲 */}
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="p-4 rounded-full text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-md transition-all active:scale-90"
          aria-label="上一曲"
        >
          <svg className={`${iconSize} drop-shadow-lg`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        {/* 播放/暂停 */}
        <button
          onClick={(e) => { e.stopPropagation(); onPlayPause() }}
          className={`${buttonSize} flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300 hover:scale-110 active:scale-95`}
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <svg className={`${playIconSize} fill-current drop-shadow-lg`} viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className={`${playIconSize} fill-current ml-2 drop-shadow-lg`} viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* 下一曲 */}
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          className="p-4 rounded-full text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-md transition-all active:scale-90"
          aria-label="下一曲"
        >
          <svg className={`${iconSize} drop-shadow-lg`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

const PlayerControls = memo(PlayerControlsComponent)
PlayerControls.displayName = 'PlayerControls'

export default PlayerControls
