import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioAnalyser } from './useAudioAnalyser'

describe('useAudioAnalyser', () => {
  let mockAnalyser: AnalyserNode

  beforeEach(() => {
    // 创建模拟的 AnalyserNode
    mockAnalyser = {
      frequencyBinCount: 256,
      getByteFrequencyData: vi.fn((dataArray) => {
        // 填充模拟数据
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.floor(Math.random() * 256)
        }
      }),
    } as unknown as AnalyserNode
  })

  it('当 analyser 为 null 时返回默认值', () => {
    const { result } = renderHook(() => useAudioAnalyser(null, false))

    expect(result.current.intensity).toBe(0)
    expect(result.current.bass).toBe(0)
    expect(result.current.mid).toBe(0)
    expect(result.current.high).toBe(0)
    expect(result.current.frequencyData).toBeNull()
  })

  it('当 isPlaying 为 false 时不分析数据', () => {
    const { result } = renderHook(() => useAudioAnalyser(mockAnalyser, false))

    expect(result.current.intensity).toBe(0)
    expect(mockAnalyser.getByteFrequencyData).not.toHaveBeenCalled()
  })

  it('当 isPlaying 为 true 时分析数据', async () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useAudioAnalyser(mockAnalyser, true))

    // 等待 requestAnimationFrame 被调用
    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    expect(mockAnalyser.getByteFrequencyData).toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('使用自定义频段配置', async () => {
    vi.useFakeTimers()

    const customBands = { bassEnd: 0.2, midEnd: 0.8 }

    const { result } = renderHook(() =>
      useAudioAnalyser(mockAnalyser, true, customBands)
    )

    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    // 验证分析器被调用
    expect(mockAnalyser.getByteFrequencyData).toHaveBeenCalled()

    vi.useRealTimers()
  })
})
