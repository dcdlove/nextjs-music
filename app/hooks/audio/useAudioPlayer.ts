import { useRef, useState, useEffect, useCallback } from 'react'

/**
 * 播放器状态
 */
export interface PlayerState {
  /** 当前播放时间（秒） */
  currentTime: number
  /** 总时长（秒） */
  duration: number
  /** 音量 (0-1) */
  volume: number
  /** 是否正在播放 */
  isPlaying: boolean
  /** 是否正在加载 */
  isLoading: boolean
  /** 错误信息 */
  error: string | null
}

/**
 * 播放器操作方法
 */
export interface PlayerActions {
  /** 播放 */
  play: () => void
  /** 暂停 */
  pause: () => void
  /** 切换播放/暂停 */
  toggle: () => void
  /** 跳转到指定时间 */
  seek: (time: number) => void
  /** 设置音量 */
  setVolume: (volume: number) => void
  /** 获取 audio 元素引用 */
  getAudioElement: () => HTMLAudioElement | null
}

/**
 * 播放器配置
 */
interface UseAudioPlayerOptions {
  /** 初始音量 */
  initialVolume?: number
  /** 播放结束回调 */
  onEnded?: () => void
  /** 播放错误回调 */
  onError?: (error: Error) => void
}

export type UseAudioPlayerReturn = PlayerState & PlayerActions

/**
 * 音频播放器 Hook
 * 管理音频元素的播放状态、进度、音量等
 *
 * @param audioUrl - 音频 URL
 * @param options - 播放器配置
 * @returns 播放器状态和操作方法
 */
export function useAudioPlayer(
  audioUrl: string,
  options: UseAudioPlayerOptions = {}
): UseAudioPlayerReturn {
  const { initialVolume = 0.8, onEnded, onError } = options

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [state, setState] = useState<PlayerState>({
    currentTime: 0,
    duration: 0,
    volume: initialVolume,
    isPlaying: false,
    isLoading: true,
    error: null,
  })

  /**
   * 初始化 audio 元素
   */
  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.volume = initialVolume
    audioRef.current = audio

    // 事件监听器
    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }))
    }

    const handleLoadedMetadata = () => {
      setState(prev => ({
        ...prev,
        duration: audio.duration,
        isLoading: false,
      }))
    }

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false }))
      onEnded?.()
    }

    const handleError = () => {
      const error = new Error('音频加载失败')
      setState(prev => ({ ...prev, error: error.message, isLoading: false }))
      onError?.(error)
    }

    const handleCanPlay = () => {
      setState(prev => ({ ...prev, isLoading: false }))
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('canplay', handleCanPlay)
      audioRef.current = null
    }
  }, [initialVolume, onEnded, onError])

  /**
   * URL 变化时更新音频源
   */
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl
      audioRef.current.load()
      setState(prev => ({ ...prev, isLoading: true, error: null }))
    }
  }, [audioUrl])

  /**
   * 播放
   */
  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => setState(prev => ({ ...prev, isPlaying: true })))
        .catch(err => {
          setState(prev => ({ ...prev, error: err.message }))
        })
    }
  }, [])

  /**
   * 暂停
   */
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setState(prev => ({ ...prev, isPlaying: false }))
    }
  }, [])

  /**
   * 切换播放/暂停
   */
  const toggle = useCallback(() => {
    if (state.isPlaying) {
      pause()
    } else {
      play()
    }
  }, [state.isPlaying, play, pause])

  /**
   * 跳转到指定时间
   */
  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(time, state.duration))
      setState(prev => ({ ...prev, currentTime: audioRef.current!.currentTime }))
    }
  }, [state.duration])

  /**
   * 设置音量
   */
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume
    }
    setState(prev => ({ ...prev, volume: clampedVolume }))
  }, [])

  /**
   * 获取 audio 元素引用
   */
  const getAudioElement = useCallback(() => audioRef.current, [])

  return {
    ...state,
    play,
    pause,
    toggle,
    seek,
    setVolume,
    getAudioElement,
  }
}
