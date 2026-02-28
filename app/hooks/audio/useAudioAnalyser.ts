import { useRef, useState, useEffect } from 'react'

/**
 * 音频分析数据
 */
export interface AudioAnalysisData {
  /** 总体强度 (0-255) */
  intensity: number
  /** 低频/贝斯强度 (0-255) */
  bass: number
  /** 中频强度 (0-255) */
  mid: number
  /** 高频强度 (0-255) */
  high: number
  /** 原始频率数据 */
  frequencyData: Uint8Array | null
}

/**
 * 频段配置
 */
interface FrequencyBands {
  bassEnd: number    // 低频结束位置
  midEnd: number     // 中频结束位置
}

const DEFAULT_BANDS: FrequencyBands = {
  bassEnd: 0.1,   // 前 10% 为低频
  midEnd: 0.7,    // 10%-70% 为中频，70%+ 为高频
}

const DEFAULT_ANALYSIS_DATA: AudioAnalysisData = {
  intensity: 0,
  bass: 0,
  mid: 0,
  high: 0,
  frequencyData: null,
}

/**
 * 音频分析 Hook
 * 从 AnalyserNode 提取频率数据并计算各频段强度
 *
 * @param analyser - AnalyserNode 实例
 * @param isPlaying - 是否正在播放
 * @param bands - 频段配置
 * @returns 音频分析数据
 */
export function useAudioAnalyser(
  analyser: AnalyserNode | null,
  isPlaying: boolean,
  bands: FrequencyBands = DEFAULT_BANDS
): AudioAnalysisData {
  const rafIdRef = useRef<number>(0)
  const [analysisData, setAnalysisData] = useState<AudioAnalysisData>(DEFAULT_ANALYSIS_DATA)

  /**
   * 分析循环
   */
  useEffect(() => {
    if (!analyser || !isPlaying) {
      cancelAnimationFrame(rafIdRef.current)
      return
    }

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    // 计算频段边界
    const bassEndIndex = Math.floor(bufferLength * bands.bassEnd)
    const midEndIndex = Math.floor(bufferLength * bands.midEnd)

    const analyze = () => {
      analyser.getByteFrequencyData(dataArray)

      let total = 0
      let bassTotal = 0
      let midTotal = 0
      let highTotal = 0

      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i]
        total += value

        if (i < bassEndIndex) {
          bassTotal += value
        } else if (i < midEndIndex) {
          midTotal += value
        } else {
          highTotal += value
        }
      }

      const bassCount = bassEndIndex
      const midCount = midEndIndex - bassEndIndex
      const highCount = bufferLength - midEndIndex

      setAnalysisData({
        intensity: total / bufferLength,
        bass: bassCount > 0 ? bassTotal / bassCount : 0,
        mid: midCount > 0 ? midTotal / midCount : 0,
        high: highCount > 0 ? highTotal / highCount : 0,
        frequencyData: dataArray.slice(), // 复制数据避免引用问题
      })

      rafIdRef.current = requestAnimationFrame(analyze)
    }

    analyze()

    return () => cancelAnimationFrame(rafIdRef.current)
  }, [analyser, isPlaying, bands])

  return analysisData
}
