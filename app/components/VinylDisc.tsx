import React, { memo } from 'react'

/**
 * 黑胶唱片组件 Props
 */
interface VinylDiscProps {
  /** 是否正在播放 */
  isPlaying: boolean
  /** 主题渐变色 */
  gradient: string
  /** 响应式尺寸 */
  size: 'small' | 'large'
}

/**
 * 黑胶唱片组件
 * 包含纹理层、流光效果、旋转的专辑封面
 */
function VinylDiscComponent({ isPlaying, gradient, size }: VinylDiscProps) {
  const dimensions = size === 'small' ? 320 : 420

  return (
    <div
      className="absolute inset-0 rounded-full overflow-hidden shadow-2xl border border-white/10 backdrop-blur-md"
      style={{
        width: dimensions,
        height: dimensions,
        background: `radial-gradient(circle at 30% 30%, rgba(20,20,20,0.95), rgba(0,0,0,1))`,
        boxShadow: `
          0 0 0 1px rgba(255,255,255,0.05),
          0 20px 50px -10px rgba(0,0,0,0.5),
          inset 0 0 60px rgba(0,0,0,0.8)
        `
      }}
    >
      {/* 纹理层 */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          background: `repeating-radial-gradient(
            #333 0,
            #333 1px,
            transparent 2px,
            transparent 4px
          )`
        }}
      />

      {/* 动态流光层 */}
      <div
        className="absolute inset-[-50%] opacity-20 bg-gradient-to-tr from-transparent via-white to-transparent rotate-45 pointer-events-none"
        style={{
          animation: isPlaying ? 'vinyl-shine 8s linear infinite' : 'none'
        }}
      />

      {/* 旋转的核心部分 */}
      <div
        className={`absolute inset-[18%] rounded-full transition-transform duration-[20s] linear ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''}`}
        style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
      >
        {/* 专辑封面 */}
        <div className="absolute inset-0 rounded-full overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8)] border-2 border-white/10">
          <div
            className="w-full h-full bg-cover bg-center transition-transform duration-700 hover:scale-110"
            style={{
              background: gradient,
            }}
          />
          {/* 中心孔 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full border border-white/20 shadow-inner" />
        </div>
      </div>
    </div>
  )
}

const VinylDisc = memo(VinylDiscComponent)
VinylDisc.displayName = 'VinylDisc'

export default VinylDisc
