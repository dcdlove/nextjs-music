/**
 * 歌词 API 服务
 * 使用 LRClib API 获取歌词
 */

import { LyricLine, Lyrics } from '../../types'
import { apiClient } from './client'

/**
 * LRClib API 响应类型
 */
interface LrcLibResponse {
  id: number
  artistName: string
  trackName: string
  plainLyrics: string | null
  syncedLyrics: string | null
}

/**
 * 解析 LRC 格式歌词
 * 支持格式: [mm:ss.xx], [mm:ss.xxx], [mm:ss:xx]
 *
 * @param lrcText - LRC 格式歌词文本
 * @returns 解析后的歌词行数组
 */
export function parseLrc(lrcText: string | null | undefined): LyricLine[] {
  // 处理空值
  if (!lrcText || typeof lrcText !== 'string') {
    return []
  }

  const lines: LyricLine[] = []
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.|:)(\d{2,3})\]/g

  // 按行分割
  const textLines = lrcText.split('\n')

  for (const line of textLines) {
    // 重置正则的 lastIndex
    timeRegex.lastIndex = 0

    // 查找所有时间戳
    const timestamps: number[] = []
    let match: RegExpExecArray | null
    let lastIndex = 0

    while ((match = timeRegex.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const fraction = match[3]

      // 计算时间（秒）
      let timeInSeconds: number
      if (fraction.length === 2) {
        // 两位数表示百分之一秒
        timeInSeconds = minutes * 60 + seconds + parseInt(fraction, 10) / 100
      } else {
        // 三位数表示毫秒
        timeInSeconds = minutes * 60 + seconds + parseInt(fraction, 10) / 1000
      }

      timestamps.push(timeInSeconds)
      lastIndex = timeRegex.lastIndex
    }

    // 获取歌词文本（去掉时间戳部分）
    const text = line.slice(lastIndex).trim()

    // 跳过空文本
    if (!text) {
      continue
    }

    // 为每个时间戳创建歌词行
    for (const time of timestamps) {
      lines.push({ time, text })
    }
  }

  // 按时间排序
  lines.sort((a, b) => a.time - b.time)

  return lines
}

/**
 * 歌词 API 服务
 */
export const lyricsApi = {
  /**
   * 搜索歌词
   *
   * @param singer - 歌手名
   * @param title - 歌曲名
   * @returns 歌词数据或 null
   */
  async searchLyrics(singer: string, title: string): Promise<Lyrics | null> {
    try {
      // 构建请求 URL
      const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(singer)}&track_name=${encodeURIComponent(title)}`

      const response = await apiClient.get<LrcLibResponse | null>(url)

      // 没有找到歌词
      if (!response) {
        return null
      }

      // 解析同步歌词
      const syncedLyrics = parseLrc(response.syncedLyrics)

      return {
        id: String(response.id),
        singer: response.artistName,
        title: response.trackName,
        plainLyrics: response.plainLyrics || '',
        syncedLyrics,
        source: 'lrclib',
      }
    } catch (error) {
      // 记录错误但不抛出，返回 null
      console.error('Failed to fetch lyrics:', error)
      return null
    }
  },
}
