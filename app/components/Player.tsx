import React, { memo, useEffect, useRef, useState, useCallback } from 'react'
import { Song } from '../types'
import CircularProgress from './CircularProgress'
import DynamicBackground from './DynamicBackground'
import CircularVisualizer from './CircularVisualizer'
import VinylDisc from './VinylDisc'
import PlayerControls from './PlayerControls'
import TrackInfo from './TrackInfo'
import { useThemeColor } from '../hooks/useThemeColor'
import { useAudioContext, useAudioAnalyser } from '../hooks/audio'

/**
 * Player 组件 Props
 */
interface PlayerProps {
  currentTrack?: Song
  audioUrl: string
  onEnded: () => void
  onNext: () => void
  onPrev: () => void
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  onTogglePlaylist: () => void
  isPlaylistOpen: boolean
}

/**
 * 主播放器组件
 * 整合黑胶唱片、播放控制、歌曲信息等子组件
 */
function PlayerComponent({
  currentTrack,
  audioUrl,
  onEnded,
  onNext,
  onPrev,
  isPlaying,
  setIsPlaying,
  onTogglePlaylist,
}: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const userHasInteracted = useRef(false)

  // 主题色
  const themeColor = useThemeColor(
    currentTrack ? `${currentTrack.singer}-${currentTrack.title}` : 'default'
  )

  // 音频 Hooks
  const { analyser, isInitialized, initialize, resume } = useAudioContext(512)
  const audioData = useAudioAnalyser(analyser, isPlaying)
  const audioDataRef = useRef({ intensity: 0, bass: 0, high: 0 })

  // 响应式尺寸
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const playerSize = isSmallScreen ? 'small' : 'large'

  // 更新音频数据 ref
  useEffect(() => {
    audioDataRef.current = {
      intensity: audioData.intensity,
      bass: audioData.bass,
      high: audioData.high,
    }
  }, [audioData])

  // 初始化 AudioContext
  useEffect(() => {
    if (audioRef.current && !isInitialized && isPlaying) {
      initialize(audioRef.current)
      resume()
    }
  }, [isPlaying, isInitialized, initialize, resume])

  // 控制播放状态
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          if (err.name === 'NotAllowedError') {
            setIsPlaying(false)
          } else {
            console.error('播放失败:', err)
          }
        })
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, audioUrl, setIsPlaying])

  // URL 变化时自动播放（需用户已交互）
  useEffect(() => {
    if (audioUrl && userHasInteracted.current) {
      setIsPlaying(true)
    }
  }, [audioUrl, setIsPlaying])

  // 响应式处理
  useEffect(() => {
    const checkScreenSize = () => setIsSmallScreen(window.innerWidth < 640)
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // 事件处理
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) setDuration(audioRef.current.duration)
  }, [])

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const handlePlayPause = useCallback(() => {
    userHasInteracted.current = true
    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying])

  const handlePrev = useCallback(() => {
    userHasInteracted.current = true
    onPrev()
  }, [onPrev])

  const handleNext = useCallback(() => {
    userHasInteracted.current = true
    onNext()
  }, [onNext])

  // 计算进度
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const vinylRadius = isSmallScreen ? 160 : 210
  const visualizerRadius = isSmallScreen ? 180 : 235
  const progressRadius = isSmallScreen ? 170 : 220

  return (
    <>
      {/* 动态背景 */}
      <DynamicBackground
        isPlaying={isPlaying}
        audioDataRef={audioDataRef}
        vinylPosition={{ x: 50, y: 45 }}
        themeColor={themeColor}
      />

      <div className="relative z-20 flex flex-col items-center justify-center min-h-[70vh] w-full perspective-[1000px]">
        {/* 唱片容器 */}
        <div
          className="relative group animate-[pulse-slow_6s_ease-in-out_infinite]"
          style={{
            transformStyle: 'preserve-3d',
            animationPlayState: isPlaying ? 'running' : 'paused',
          }}
        >
          {/* 动态光晕 */}
          <div
            className="absolute inset-0 rounded-full blur-[60px] transition-all duration-200"
            style={{
              background: themeColor.gradient,
              opacity: isPlaying ? 0.4 : 0.1,
              transform: isPlaying ? 'scale(1.1)' : 'scale(0.9)',
            }}
          />

          {/* 唱片主体 */}
          <div
            className="relative flex items-center justify-center"
            style={{
              width: vinylRadius * 2,
              height: vinylRadius * 2,
            }}
          >
            {/* 外层可视化光环 */}
            <div className="absolute inset-[-300px] z-0 opacity-10">
              <CircularVisualizer
                analyser={analyser}
                isPlaying={isPlaying}
                radius={visualizerRadius}
              />
            </div>

            {/* 进度环 */}
            <div className="absolute inset-[-10px] z-10">
              <CircularProgress
                radius={progressRadius}
                stroke={4}
                progress={progress}
                color={themeColor.primary}
                onChange={(val) => handleSeek((val / 100) * duration)}
              />
            </div>

            {/* 黑胶唱片 */}
            <VinylDisc
              isPlaying={isPlaying}
              gradient={themeColor.gradient}
              size={playerSize}
            />

            {/* 播放控制 */}
            <PlayerControls
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onPrev={handlePrev}
              onNext={handleNext}
              size={playerSize}
            />
          </div>
        </div>

        {/* 歌曲信息 */}
        <TrackInfo
          title={currentTrack?.title}
          singer={currentTrack?.singer}
          gradient={themeColor.gradient}
          primaryColor={themeColor.primary}
          onTogglePlaylist={onTogglePlaylist}
        />

        {/* 音频元素 */}
        <audio
          ref={audioRef}
          src={audioUrl}
          crossOrigin="anonymous"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={onEnded}
          className="hidden"
        />
      </div>
    </>
  )
}

// 使用 memo 并提供自定义比较函数
const Player = memo(PlayerComponent, (prevProps, nextProps) => {
  return (
    prevProps.audioUrl === nextProps.audioUrl &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.isPlaylistOpen === nextProps.isPlaylistOpen &&
    prevProps.currentTrack?.url === nextProps.currentTrack?.url &&
    prevProps.currentTrack?.title === nextProps.currentTrack?.title &&
    prevProps.currentTrack?.singer === nextProps.currentTrack?.singer
  )
})

Player.displayName = 'Player'

export default Player
