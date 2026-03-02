import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { lyricsCache, LYRICS_CACHE_KEY } from './lyricsCache'
import { Lyrics } from '../types'

describe('lyricsCache', () => {
  // 在每个测试前清空缓存
  beforeEach(() => {
    lyricsCache.clear()
  })

  afterEach(() => {
    lyricsCache.clear()
  })

  describe('get 和 set', () => {
    it('应该正确存取歌词', () => {
      const mockLyrics: Lyrics = {
        id: '123',
        singer: 'Test Artist',
        title: 'Test Song',
        plainLyrics: 'Plain lyrics',
        syncedLyrics: [{ time: 10, text: 'Test line' }],
        source: 'lrclib',
      }

      const key = lyricsCache.createKey('Test Artist', 'Test Song')
      lyricsCache.set(key, mockLyrics)

      const result = lyricsCache.get(key)

      expect(result).toEqual(mockLyrics)
    })

    it('获取不存在的缓存应该返回 null', () => {
      const result = lyricsCache.get('nonexistent-key')
      expect(result).toBeNull()
    })

    it('应该持久化到 localStorage', () => {
      const mockLyrics: Lyrics = {
        id: '123',
        singer: 'Test Artist',
        title: 'Test Song',
        plainLyrics: 'Plain lyrics',
        syncedLyrics: [],
        source: 'lrclib',
      }

      const key = lyricsCache.createKey('Test Artist', 'Test Song')
      lyricsCache.set(key, mockLyrics)

      // 验证 localStorage 被调用
      const stored = localStorage.getItem(LYRICS_CACHE_KEY)
      expect(stored).not.toBeNull()

      const parsed = JSON.parse(stored!)
      // 缓存条目包含 data 和 timestamp
      expect(parsed[key].data).toEqual(mockLyrics)
      expect(parsed[key].timestamp).toBeDefined()
    })
  })

  describe('createKey', () => {
    it('应该创建格式正确的 key', () => {
      const key = lyricsCache.createKey('黄霄雲', '星辰大海')
      expect(key).toBe('lyrics:黄霄雲:星辰大海')
    })

    it('应该处理特殊字符', () => {
      const key = lyricsCache.createKey('Artist/Test', 'Song:Name')
      expect(key).toContain('Artist/Test')
      expect(key).toContain('Song:Name')
    })
  })

  describe('clear', () => {
    it('应该清空所有缓存', () => {
      const mockLyrics: Lyrics = {
        id: '123',
        singer: 'Test Artist',
        title: 'Test Song',
        plainLyrics: '',
        syncedLyrics: [],
        source: 'lrclib',
      }

      lyricsCache.set('key1', mockLyrics)
      lyricsCache.set('key2', mockLyrics)

      lyricsCache.clear()

      expect(lyricsCache.get('key1')).toBeNull()
      expect(lyricsCache.get('key2')).toBeNull()
    })

    it('应该从 localStorage 中删除', () => {
      lyricsCache.set('test-key', {
        id: '1',
        singer: 'A',
        title: 'B',
        plainLyrics: '',
        syncedLyrics: [],
        source: 'lrclib',
      })

      lyricsCache.clear()

      expect(localStorage.getItem(LYRICS_CACHE_KEY)).toBeNull()
    })
  })

  describe('has', () => {
    it('存在时应该返回 true', () => {
      const mockLyrics: Lyrics = {
        id: '123',
        singer: 'Test Artist',
        title: 'Test Song',
        plainLyrics: '',
        syncedLyrics: [],
        source: 'lrclib',
      }

      const key = lyricsCache.createKey('Test Artist', 'Test Song')
      lyricsCache.set(key, mockLyrics)

      expect(lyricsCache.has(key)).toBe(true)
    })

    it('不存在时应该返回 false', () => {
      expect(lyricsCache.has('nonexistent-key')).toBe(false)
    })
  })

  describe('remove', () => {
    it('应该删除指定的缓存项', () => {
      const mockLyrics: Lyrics = {
        id: '123',
        singer: 'Test Artist',
        title: 'Test Song',
        plainLyrics: '',
        syncedLyrics: [],
        source: 'lrclib',
      }

      lyricsCache.set('key1', mockLyrics)
      lyricsCache.set('key2', mockLyrics)

      lyricsCache.remove('key1')

      expect(lyricsCache.get('key1')).toBeNull()
      expect(lyricsCache.get('key2')).not.toBeNull()
    })
  })

  describe('getStats', () => {
    it('应该返回正确的缓存统计', () => {
      const mockLyrics: Lyrics = {
        id: '123',
        singer: 'Test Artist',
        title: 'Test Song',
        plainLyrics: 'x'.repeat(100), // 100 字节
        syncedLyrics: [],
        source: 'lrclib',
      }

      lyricsCache.set('key1', mockLyrics)
      lyricsCache.set('key2', mockLyrics)

      const stats = lyricsCache.getStats()

      expect(stats.count).toBe(2)
      expect(stats.size).toBeGreaterThan(0)
    })

    it('空缓存应该返回零统计', () => {
      const stats = lyricsCache.getStats()

      expect(stats.count).toBe(0)
      expect(stats.size).toBe(0)
    })
  })

  describe('清理过期缓存', () => {
    it('应该清理过期的缓存项', () => {
      const mockLyrics: Lyrics = {
        id: '123',
        singer: 'Test Artist',
        title: 'Test Song',
        plainLyrics: '',
        syncedLyrics: [],
        source: 'lrclib',
      }

      // 直接操作 localStorage 模拟过期缓存
      const expiredEntry = {
        data: mockLyrics,
        timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 天前（超过 7 天）
      }

      const cache = {
        'expired-key': expiredEntry,
      }

      // 先清空内存缓存，然后设置 localStorage
      lyricsCache.clear()
      localStorage.setItem(LYRICS_CACHE_KEY, JSON.stringify(cache))

      // 清理 7 天前的缓存（cleanup 会重新从 localStorage 加载）
      const removedCount = lyricsCache.cleanup(7)

      expect(removedCount).toBe(1)
      expect(lyricsCache.get('expired-key')).toBeNull()
    })

    it('不应该清理未过期的缓存项', () => {
      const mockLyrics: Lyrics = {
        id: '123',
        singer: 'Test Artist',
        title: 'Test Song',
        plainLyrics: '',
        syncedLyrics: [],
        source: 'lrclib',
      }

      const key = lyricsCache.createKey('Test Artist', 'Test Song')
      lyricsCache.set(key, mockLyrics)

      // 清理 7 天前的缓存
      const removedCount = lyricsCache.cleanup(7)

      expect(removedCount).toBe(0)
      expect(lyricsCache.get(key)).not.toBeNull()
    })
  })

  describe('边界情况', () => {
    it('应该处理 localStorage 不可用的情况', () => {
      // 模拟 localStorage 抛出异常
      const originalGetItem = localStorage.getItem
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage not available')
      })

      // get 不应该抛出异常
      expect(() => lyricsCache.get('some-key')).not.toThrow()

      vi.spyOn(Storage.prototype, 'getItem').mockRestore()
    })

    it('应该处理损坏的 JSON 数据', () => {
      localStorage.setItem(LYRICS_CACHE_KEY, 'invalid json {')

      // get 不应该抛出异常
      expect(() => lyricsCache.get('some-key')).not.toThrow()
    })
  })
})
