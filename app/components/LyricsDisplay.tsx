'use client'

import React, { useRef, useEffect, useMemo, memo } from 'react'
import { LyricLine } from '../types'

interface LyricsDisplayProps {
  /** 同步歌词数组 */
  lyrics: LyricLine[]
  /** 当前行索引 */
  currentIndex: number
  /** 是否正在播放 */
  isPlaying: boolean
  /** 主题色 */
  themeColor?: {
    primary: string
    primaryRgb: string
  }
}

/**
 * 单行歌词组件
 */
const LyricsLine = memo(function LyricsLine({
  line,
  index,
  currentIndex,
  isPlaying,
  themeColor,
}: {
  line: LyricLine
  index: number
  currentIndex: number
  isPlaying: boolean
  themeColor?: { primary: string; primaryRgb: string }
}) {
  const isCurrent = index === currentIndex
  const isPast = index < currentIndex

  // 根据距离当前行的距离计算透明度和模糊
  const distance = Math.abs(index - currentIndex)
  const opacity = isCurrent ? 1 : Math.max(0.15, 1 - distance * 0.2)
  const blur = isCurrent ? 0 : Math.min(distance * 2, 8)

  // 缩放效果
  const scale = isCurrent ? 1.08 : Math.max(0.85, 1 - distance * 0.05)

  // 字体大小
  const fontSize = isCurrent
    ? 'text-2xl sm:text-3xl md:text-4xl'
    : 'text-lg sm:text-xl md:text-2xl'

  return (
    <div
      data-index={index}
      className={`
        lyrics-line
        py-3 sm:py-4
        transition-all
        duration-500
        ease-out
        text-center
        px-4
        ${fontSize}
        ${isCurrent ? 'font-bold' : 'font-medium'}
      `}
      style={{
        opacity,
        filter: blur > 0 ? `blur(${blur}px)` : 'none',
        transform: `scale(${scale})`,
        color: isCurrent
          ? (themeColor?.primary || '#ffffff')
          : 'rgba(255, 255, 255, 0.7)',
        textShadow: isCurrent
          ? `
              0 0 40px ${themeColor?.primary || '#22d3ee'},
              0 0 80px rgba(${themeColor?.primaryRgb || '34, 211, 238'}, 0.5),
              0 0 120px rgba(${themeColor?.primaryRgb || '34, 211, 238'}, 0.3)
            `
          : '0 0 20px rgba(255, 255, 255, 0.1)',
        letterSpacing: '0.02em',
        lineHeight: '1.5',
      }}
    >
      <span className={`
        inline-block
        transition-transform
        duration-300
        ${isCurrent && isPlaying ? 'animate-lyrics-glow' : ''}
      `}>
        {line.text || '♪'}
      </span>
    </div>
  )
})

/**
 * 沉浸式歌词显示组件
 * Apple Music 风格 - 歌词居中、大字体、与背景融合
 */
function LyricsDisplayComponent({
  lyrics,
  currentIndex,
  isPlaying,
  themeColor,
}: LyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevIndexRef = useRef<number>(-1)

  // 计算可见范围（当前行前后各显示几行）
  const visibleRange = useMemo(() => {
    const beforeCount = 4
    const afterCount = 4
    const start = Math.max(0, currentIndex - beforeCount)
    const end = Math.min(lyrics.length - 1, currentIndex + afterCount)
    return { start, end }
  }, [currentIndex, lyrics.length])

  // 当前行变化时自动滚动
  useEffect(() => {
    if (
      currentIndex >= 0 &&
      currentIndex !== prevIndexRef.current &&
      containerRef.current
    ) {
      const currentLineElement = containerRef.current.querySelector(
        `[data-index="${currentIndex}"]`
      )

      if (currentLineElement && typeof currentLineElement.scrollIntoView === 'function') {
        currentLineElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }

      prevIndexRef.current = currentIndex
    }
  }, [currentIndex])

  // 如果没有歌词，不渲染
  if (lyrics.length === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      data-testid="lyrics-container"
      role="region"
      aria-label="歌词"
      className={`
        fixed
        inset-0
        flex
        flex-col
        items-start
        justify-center
        pointer-events-none
        z-10
        overflow-hidden
        pl-[15%]
      `}
    >
      {/* 背景氛围层 - 与歌词主题色融合 */}
      <div
        className="absolute inset-0 opacity-30 transition-opacity duration-1000"
        style={{
          background: `
            radial-gradient(
              ellipse 60% 50% at 35% 50%,
              rgba(${themeColor?.primaryRgb || '34, 211, 238'}, 0.3) 0%,
              transparent 70%
            )
          `,
        }}
      />

      {/* 歌词容器 - 左侧显示 */}
      <div
        className={`
          relative
          w-full
          max-w-lg
          px-4
          py-12
          overflow-y-auto
          lyrics-scroll-container
          ${isPlaying ? 'lyrics-active' : ''}
        `}
        style={{
          maxHeight: '80vh',
          maskImage: `
            linear-gradient(
              to bottom,
              transparent 0%,
              black 15%,
              black 85%,
              transparent 100%
            )
          `,
          WebkitMaskImage: `
            linear-gradient(
              to bottom,
              transparent 0%,
              black 15%,
              black 85%,
              transparent 100%
            )
          `,
        }}
      >
        {/* 顶部占位 - 让第一行可以居中 */}
        <div className="h-[30vh]" />

        {/* 歌词行 */}
        <div className="lyrics-content">
          {lyrics.map((line, index) => (
            <LyricsLine
              key={`${line.time}-${index}`}
              line={line}
              index={index}
              currentIndex={currentIndex}
              isPlaying={isPlaying}
              themeColor={themeColor}
            />
          ))}
        </div>

        {/* 底部占位 - 让最后一行可以居中 */}
        <div className="h-[30vh]" />
      </div>

      {/* 装饰性光晕 - 随当前歌词位置移动 */}
      {currentIndex >= 0 && isPlaying && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-1000"
          style={{
            background: `
              radial-gradient(
                circle at 50% 50%,
                rgba(${themeColor?.primaryRgb || '34, 211, 238'}, 0.08) 0%,
                transparent 50%
              )
            `,
            animation: 'lyrics-pulse 4s ease-in-out infinite',
          }}
        />
      )}
    </div>
  )
}

/**
 * 使用 memo 优化歌词显示组件
 */
export const LyricsDisplay = memo(LyricsDisplayComponent, (prevProps, nextProps) => {
  return (
    prevProps.currentIndex === nextProps.currentIndex &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.lyrics === nextProps.lyrics &&
    prevProps.themeColor?.primary === nextProps.themeColor?.primary
  )
})
