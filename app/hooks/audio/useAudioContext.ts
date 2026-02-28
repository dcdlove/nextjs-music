import { useRef, useState, useEffect, useCallback } from 'react'

/**
 * AudioContext 状态
 */
interface AudioContextState {
  audioContext: AudioContext | null
  analyser: AnalyserNode | null
  isInitialized: boolean
  error: Error | null
}

/**
 * AudioContext 操作方法
 */
interface AudioContextActions {
  initialize: (audioElement: HTMLAudioElement) => void
  resume: () => void
  suspend: () => void
}

/**
 * useAudioContext 返回值
 */
export type UseAudioContextReturn = AudioContextState & AudioContextActions

/**
 * 管理 Web Audio API 的 AudioContext
 * 负责音频上下文的初始化、分析器节点的创建
 *
 * @param fftSize - 分析器的 FFT 大小，默认 512
 * @returns AudioContext 状态和操作方法
 */
export function useAudioContext(fftSize: number = 512): UseAudioContextReturn {
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)

  const [state, setState] = useState<AudioContextState>({
    audioContext: null,
    analyser: null,
    isInitialized: false,
    error: null,
  })

  /**
   * 初始化 AudioContext 并连接音频源
   */
  const initialize = useCallback((audioElement: HTMLAudioElement) => {
    // 避免重复初始化
    if (sourceRef.current) {
      return
    }

    try {
      // 创建 AudioContext（兼容 Safari）
      const AudioContextClass = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

      const context = new AudioContextClass()
      const analyser = context.createAnalyser()
      analyser.fftSize = fftSize
      analyser.smoothingTimeConstant = 0.8

      // 创建音频源并连接节点
      const source = context.createMediaElementSource(audioElement)
      source.connect(analyser)
      analyser.connect(context.destination)

      audioContextRef.current = context
      sourceRef.current = source

      setState({
        audioContext: context,
        analyser,
        isInitialized: true,
        error: null,
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('AudioContext 初始化失败'),
      }))
    }
  }, [fftSize])

  /**
   * 恢复音频上下文（用户交互后调用）
   */
  const resume = useCallback(() => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume()
    }
  }, [])

  /**
   * 暂停音频上下文
   */
  const suspend = useCallback(() => {
    if (audioContextRef.current?.state === 'running') {
      audioContextRef.current.suspend()
    }
  }, [])

  /**
   * 组件卸载时关闭 AudioContext
   */
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
        sourceRef.current = null
      }
    }
  }, [])

  return {
    ...state,
    initialize,
    resume,
    suspend,
  }
}
