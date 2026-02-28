import { describe, it, expect, vi, beforeEach } from 'vitest'
import { musicApi } from './music'

// 模拟 fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// 模拟 navigator.userAgent
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  writable: true,
})

describe('musicApi', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('fetchPlaylist', () => {
    it('获取并处理播放列表', async () => {
      const mockData = {
        rows: [
          { singer: 'Artist1', title: 'Song1', ext: '.mp3' },
          { singer: 'Artist2', title: 'Song2', ext: '.mp3' },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockData),
      })

      const songs = await musicApi.fetchPlaylist()

      expect(songs).toHaveLength(2)
      expect(songs[0].singer).toBe('Artist1')
      expect(songs[0].title).toBe('Song1')
      expect(songs[0].url).toBeDefined()
      expect(songs[0].url2).toBeDefined()
    })

    it('处理空播放列表', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ rows: [] }),
      })

      const songs = await musicApi.fetchPlaylist()

      expect(songs).toHaveLength(0)
    })

    it('处理无效数据格式', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ invalid: 'data' }),
      })

      await expect(musicApi.fetchPlaylist()).rejects.toThrow('无效的播放列表数据格式')
    })

    it('使用自定义数据 URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ rows: [] }),
      })

      await musicApi.fetchPlaylist('/custom/data.json')

      expect(mockFetch).toHaveBeenCalledWith('/custom/data.json', expect.any(Object))
    })
  })

  describe('buildAudioStreamUrl', () => {
    it('构建音频流 URL', () => {
      const url = musicApi.buildAudioStreamUrl('Artist-Song.lkmp3')

      expect(url).toContain('/api/res2')
      expect(url).toContain('name=')
      expect(url).toContain('Artist-Song.lkmp3')
    })

    it('使用自定义代理', () => {
      const url = musicApi.buildAudioStreamUrl('Artist-Song.lkmp3', 'custom.proxy')

      expect(url).toContain('proxy=custom.proxy')
    })
  })

  describe('getCdnUrl', () => {
    it('构建 CDN 直链', () => {
      const url = musicApi.getCdnUrl('Artist', 'Song', '.mp3')

      expect(url).toBe('https://cdn.jsdelivr.net/gh/dcdlove/oss/music/Artist-Song.lkmp3')
    })

    it('处理不同的扩展名', () => {
      const url = musicApi.getCdnUrl('Artist', 'Song', '.flac')

      expect(url).toContain('Artist-Song.lkflac')
    })
  })
})
