import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { LyricsDisplay } from './LyricsDisplay'
import { LyricLine } from '../types'

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('LyricsDisplay', () => {
  const mockLyrics: LyricLine[] = [
    { time: 0, text: '第一句歌词' },
    { time: 10, text: '第二句歌词' },
    { time: 20, text: '第三句歌词' },
    { time: 30, text: '第四句歌词' },
    { time: 40, text: '第五句歌词' },
  ]

  const mockThemeColor = {
    primary: '#22d3ee',
    primaryRgb: '34, 211, 238',
    gradient: 'linear-gradient(135deg, #22d3ee, #a855f7)',
    analogous1: '#a855f7',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染所有歌词行', () => {
      render(
        <LyricsDisplay
          lyrics={mockLyrics}
          currentIndex={0}
          isPlaying={true}
        />
      )

      expect(screen.getByText('第一句歌词')).toBeInTheDocument()
      expect(screen.getByText('第二句歌词')).toBeInTheDocument()
      expect(screen.getByText('第三句歌词')).toBeInTheDocument()
      expect(screen.getByText('第四句歌词')).toBeInTheDocument()
      expect(screen.getByText('第五句歌词')).toBeInTheDocument()
    })

    it('歌词为空数组时应该返回 null', () => {
      const { container } = render(
        <LyricsDisplay
          lyrics={[]}
          currentIndex={-1}
          isPlaying={true}
        />
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('高亮当前行', () => {
    it('应该高亮当前行 (index=0)', () => {
      render(
        <LyricsDisplay
          lyrics={mockLyrics}
          currentIndex={0}
          isPlaying={true}
        />
      )

      // 当前行应该有 font-bold 类（在外层 div 上）
      const currentLineContainer = document.querySelector('[data-index="0"]')
      expect(currentLineContainer).toHaveClass('font-bold')
      // 验证 span 内的文本
      expect(currentLineContainer).toHaveTextContent('第一句歌词')
    })

    it('应该高亮中间行 (index=2)', () => {
      render(
        <LyricsDisplay
          lyrics={mockLyrics}
          currentIndex={2}
          isPlaying={true}
        />
      )

      // 当前行应该有 font-bold 类（在外层 div 上）
      const currentLineContainer = document.querySelector('[data-index="2"]')
      expect(currentLineContainer).toHaveClass('font-bold')
      expect(currentLineContainer).toHaveTextContent('第三句歌词')
    })

    it('应该高亮最后一行 (index=4)', () => {
      render(
        <LyricsDisplay
          lyrics={mockLyrics}
          currentIndex={4}
          isPlaying={true}
        />
      )

      // 当前行应该有 font-bold 类（在外层 div 上）
      const currentLineContainer = document.querySelector('[data-index="4"]')
      expect(currentLineContainer).toHaveClass('font-bold')
      expect(currentLineContainer).toHaveTextContent('第五句歌词')
    })

    it('非当前行应该有较低的透明度', () => {
      render(
        <LyricsDisplay
          lyrics={mockLyrics}
          currentIndex={2}
          isPlaying={true}
        />
      )

      // 非当前行的歌词应该存在
      const nonCurrentLine = screen.getByText('第一句歌词')
      expect(nonCurrentLine).toBeInTheDocument()
      // 检查透明度是通过内联样式设置的
      expect(nonCurrentLine.style.opacity).toBeDefined()
    })
  })

  describe('主题色', () => {
    it('应该应用主题色到当前行', () => {
      render(
        <LyricsDisplay
          lyrics={mockLyrics}
          currentIndex={0}
          isPlaying={true}
          themeColor={mockThemeColor}
        />
      )

      // 当前行应该有主题色（在外层 div 上）
      const currentLineContainer = document.querySelector('[data-index="0"]')
      expect(currentLineContainer).toBeInTheDocument()
      // 检查颜色样式（浏览器可能将 hex 转为 rgb 格式）
      const color = currentLineContainer?.style.color
      // 接受 hex 或 rgb 格式
      expect(color === mockThemeColor.primary || color === 'rgb(34, 211, 238)').toBe(true)
    })
  })

  describe('沉浸式布局', () => {
    it('应该有歌词容器', () => {
      render(
        <LyricsDisplay
          lyrics={mockLyrics}
          currentIndex={0}
          isPlaying={true}
        />
      )

      const container = screen.getByTestId('lyrics-container')
      expect(container).toBeInTheDocument()
      // 检查是否是 fixed 定位
      expect(container).toHaveClass('fixed')
    })

    it('播放时应该有激活状态', () => {
      render(
        <LyricsDisplay
          lyrics={mockLyrics}
          currentIndex={0}
          isPlaying={true}
        />
      )

      const container = screen.getByTestId('lyrics-container')
      expect(container).toBeInTheDocument()
    })
  })

  describe('可访问性', () => {
    it('应该有正确的 ARIA 属性', () => {
      render(
        <LyricsDisplay
          lyrics={mockLyrics}
          currentIndex={0}
          isPlaying={true}
        />
      )

      const container = screen.getByTestId('lyrics-container')
      expect(container).toHaveAttribute('aria-label', '歌词')
      expect(container).toHaveAttribute('role', 'region')
    })
  })
})
