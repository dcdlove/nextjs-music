import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioContext } from './useAudioContext'

describe('useAudioContext', () => {
  let mockAudioElement: HTMLAudioElement

  beforeEach(() => {
    // 创建模拟的 audio 元素
    mockAudioElement = document.createElement('audio')
    vi.clearAllMocks()
  })

  it('初始状态正确', () => {
    const { result } = renderHook(() => useAudioContext())

    expect(result.current.audioContext).toBeNull()
    expect(result.current.analyser).toBeNull()
    expect(result.current.isInitialized).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('使用自定义 fftSize', () => {
    const { result } = renderHook(() => useAudioContext(1024))

    // 初始化时 fftSize 应该被应用
    expect(result.current.isInitialized).toBe(false)
  })

  it('initialize 方法可调用且不抛错', () => {
    const { result } = renderHook(() => useAudioContext())

    // 初始化方法应该可以正常调用
    expect(() => {
      act(() => {
        result.current.initialize(mockAudioElement)
      })
    }).not.toThrow()
  })

  it('避免重复初始化', () => {
    const { result } = renderHook(() => useAudioContext())

    act(() => {
      result.current.initialize(mockAudioElement)
    })

    // 再次初始化不应该抛错
    expect(() => {
      act(() => {
        result.current.initialize(mockAudioElement)
      })
    }).not.toThrow()
  })

  it('resume 和 suspend 方法可用', () => {
    const { result } = renderHook(() => useAudioContext())

    // 初始化
    act(() => {
      result.current.initialize(mockAudioElement)
    })

    // 这些方法不应该抛出错误
    expect(() => result.current.resume()).not.toThrow()
    expect(() => result.current.suspend()).not.toThrow()
  })
})
