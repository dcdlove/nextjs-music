import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { lyricsApi, parseLrc } from './lyrics'
import { apiClient } from './client'

// 模拟 apiClient
vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

describe('parseLrc', () => {
  it('应该解析标准 LRC 格式', () => {
    const lrcText = `[00:12.34]第一句歌词
[00:15.67]第二句歌词
[00:20.00]第三句歌词`

    const result = parseLrc(lrcText)

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ time: 12.34, text: '第一句歌词' })
    expect(result[1]).toEqual({ time: 15.67, text: '第二句歌词' })
    expect(result[2]).toEqual({ time: 20, text: '第三句歌词' })
  })

  it('应该处理空字符串', () => {
    const result = parseLrc('')
    expect(result).toEqual([])
  })

  it('应该处理 null 和 undefined', () => {
    expect(parseLrc(null as unknown as string)).toEqual([])
    expect(parseLrc(undefined as unknown as string)).toEqual([])
  })

  it('应该跳过没有时间戳的行', () => {
    const lrcText = `[00:12.34]第一句歌词
这是没有时间戳的行
[00:20.00]第三句歌词`

    const result = parseLrc(lrcText)

    expect(result).toHaveLength(2)
    expect(result[0].text).toBe('第一句歌词')
    expect(result[1].text).toBe('第三句歌词')
  })

  it('应该处理毫秒格式 [mm:ss.xxx]', () => {
    const lrcText = '[00:12.345]测试歌词'
    const result = parseLrc(lrcText)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ time: 12.345, text: '测试歌词' })
  })

  it('应该处理不同的时间格式 [mm:ss:xx]', () => {
    const lrcText = '[00:12:34]测试歌词'
    const result = parseLrc(lrcText)

    expect(result).toHaveLength(1)
    // mm:ss:xx 格式中 xx 是百分之一秒
    expect(result[0].time).toBeCloseTo(12.34, 2)
  })

  it('应该按时间排序歌词行', () => {
    const lrcText = `[00:30.00]第三句
[00:10.00]第一句
[00:20.00]第二句`

    const result = parseLrc(lrcText)

    expect(result[0].time).toBe(10)
    expect(result[1].time).toBe(20)
    expect(result[2].time).toBe(30)
  })

  it('应该处理空行', () => {
    const lrcText = `[00:12.34]第一句歌词

[00:20.00]第三句歌词`

    const result = parseLrc(lrcText)

    expect(result).toHaveLength(2)
  })

  it('应该处理包含特殊字符的歌词', () => {
    const lrcText = '[00:12.34]特殊字符!@#$%^&*()_+-=[]{}|;\':",./<>?'
    const result = parseLrc(lrcText)

    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('特殊字符!@#$%^&*()_+-=[]{}|;\':",./<>?')
  })

  it('应该处理包含 Unicode 和 emoji 的歌词', () => {
    const lrcText = '[00:12.34]中文 日本語 한국어 🎵🎶'
    const result = parseLrc(lrcText)

    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('中文 日本語 한국어 🎵🎶')
  })

  it('应该跳过空文本的歌词行', () => {
    const lrcText = `[00:12.34]第一句歌词
[00:15.00]
[00:20.00]第三句歌词`

    const result = parseLrc(lrcText)

    expect(result).toHaveLength(2)
    expect(result.find(l => l.time === 15)).toBeUndefined()
  })

  it('应该处理多个时间戳在同一行的情况', () => {
    // 有些 LRC 文件会有多个时间戳对应同一句歌词
    const lrcText = '[00:12.34][00:30.00]重复的歌词'
    const result = parseLrc(lrcText)

    // 根据实现，可能只取第一个时间戳或生成多行
    expect(result.length).toBeGreaterThanOrEqual(1)
  })
})

describe('lyricsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('searchLyrics', () => {
    it('应该成功获取歌词', async () => {
      const mockResponse = {
        id: 123,
        artistName: 'Test Artist',
        trackName: 'Test Song',
        plainLyrics: 'Plain lyrics text',
        syncedLyrics: '[00:12.34]Test lyrics',
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const result = await lyricsApi.searchLyrics('Test Artist', 'Test Song')

      expect(result).not.toBeNull()
      expect(result?.singer).toBe('Test Artist')
      expect(result?.title).toBe('Test Song')
      expect(result?.plainLyrics).toBe('Plain lyrics text')
      expect(result?.syncedLyrics).toHaveLength(1)
    })

    it('应该将返回的繁体歌词转换为简体', async () => {
      const mockResponse = {
        id: 123,
        artistName: 'Test Artist',
        trackName: 'Test Song',
        plainLyrics: '想聽妳說愛我',
        syncedLyrics: '[00:12.34]想聽妳說愛我',
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const result = await lyricsApi.searchLyrics('Test Artist', 'Test Song')

      expect(result?.plainLyrics).toBe('想听你说爱我')
      expect(result?.syncedLyrics[0].text).toBe('想听你说爱我')
    })

    it('没有找到歌词时应该返回 null', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(null)

      const result = await lyricsApi.searchLyrics('Unknown Artist', 'Unknown Song')

      expect(result).toBeNull()
    })

    it('API 错误时应该返回 null', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'))

      const result = await lyricsApi.searchLyrics('Test Artist', 'Test Song')

      expect(result).toBeNull()
    })

    it('应该正确编码歌手名和歌曲名', async () => {
      const mockResponse = {
        id: 123,
        artistName: '黄霄雲',
        trackName: '星辰大海',
        plainLyrics: '歌词',
        syncedLyrics: '',
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      await lyricsApi.searchLyrics('黄霄雲', '星辰大海')

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('黄霄雲'))
      )
    })

    it('没有同步歌词时应该返回空数组', async () => {
      const mockResponse = {
        id: 123,
        artistName: 'Test Artist',
        trackName: 'Test Song',
        plainLyrics: 'Plain lyrics',
        syncedLyrics: null,
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const result = await lyricsApi.searchLyrics('Test Artist', 'Test Song')

      expect(result?.syncedLyrics).toEqual([])
    })
  })
})
