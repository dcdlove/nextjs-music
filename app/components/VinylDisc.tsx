import React, { memo, useRef, useState, useEffect, useCallback } from 'react'

/**
 * 黑胶唱片组件 Props
 */
interface VinylDiscProps {
  /** 是否正在播放 */
  isPlaying: boolean
  /** 主题渐变色 */
  gradient: string
  /** 主题主色（用于发光效果） */
  primaryColor?: string
  /** 响应式尺寸 */
  size: 'small' | 'large'
  /** 音频强度（用于动态效果） */
  audioIntensity?: number
}

/**
 * 黑胶唱片组件
 *
 * 进化特性：
 * - 3D 倾斜：鼠标移动时轻微倾斜
 * - 边缘发光：随音乐强度变化
 * - 时空裂隙：播放开始时的光圈扩散
 * - 呼吸旋转：旋转速度随节拍微调
 */
function VinylDiscComponent({ isPlaying, gradient, primaryColor = '#22d3ee', size, audioIntensity = 0 }: VinylDiscProps) {
  const dimensions = size === 'small' ? 320 : 420
  const discRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [showRift, setShowRift] = useState(false)
  const lastPlayingRef = useRef(false)

  // 3D 倾斜效果 - 鼠标跟踪
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!discRef.current) return

    const rect = discRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // 计算鼠标相对于中心的偏移（-1 到 1）
    const x = (e.clientX - centerX) / (rect.width / 2)
    const y = (e.clientY - centerY) / (rect.height / 2)

    // 限制倾斜角度（最大 10 度）
    setTilt({
      x: Math.max(-10, Math.min(10, y * -10)),
      y: Math.max(-10, Math.min(10, x * 10))
    })
  }, [])

  // 鼠标离开时重置倾斜
  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 })
  }, [])

  // 播放状态变化时触发时空裂隙效果
  useEffect(() => {
    if (isPlaying && !lastPlayingRef.current) {
      setShowRift(true)
      const timer = setTimeout(() => setShowRift(false), 2000)
      return () => clearTimeout(timer)
    }
    lastPlayingRef.current = isPlaying
  }, [isPlaying])

  // 基于音频强度计算发光强度
  const glowIntensity = 0.3 + (audioIntensity / 255) * 0.5
  const edgeGlowSize = 20 + (audioIntensity / 255) * 30

  return (
    <div
      ref={discRef}
      className="absolute inset-0 rounded-full overflow-hidden shadow-2xl border border-white/10 backdrop-blur-md transition-transform duration-200 ease-out"
      style={{
        width: dimensions,
        height: dimensions,
        transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        background: `radial-gradient(circle at 30% 30%, rgba(20,20,20,0.95), rgba(0,0,0,1))`,
        boxShadow: `
          0 0 0 1px rgba(255,255,255,0.05),
          0 20px 50px -10px rgba(0,0,0,0.5),
          inset 0 0 60px rgba(0,0,0,0.8),
          0 0 ${edgeGlowSize}px ${primaryColor}${Math.round(glowIntensity * 255).toString(16).padStart(2, '0')}
        `
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
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

      {/* 边缘发光环 */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-300"
        style={{
          border: `2px solid ${primaryColor}`,
          opacity: isPlaying ? 0.6 : 0.2,
          boxShadow: `inset 0 0 20px ${primaryColor}40, 0 0 30px ${primaryColor}30`
        }}
      />

      {/* 时空裂隙效果 */}
      {showRift && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: 60,
            height: 60,
            background: `radial-gradient(circle, ${primaryColor}, transparent 70%)`,
            animation: 'time-rift 2s ease-out forwards'
          }}
        />
      )}

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
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full border border-white/20 shadow-inner"
            style={{
              boxShadow: `0 0 10px ${primaryColor}40`
            }}
          />
        </div>
      </div>

      {/* 中心发光点 */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
        style={{
          background: primaryColor,
          boxShadow: `0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}`,
          opacity: isPlaying ? 1 : 0.5,
          transition: 'opacity 0.3s'
        }}
      />
    </div>
  )
}

const VinylDisc = memo(VinylDiscComponent)
VinylDisc.displayName = 'VinylDisc'

export default VinylDisc
