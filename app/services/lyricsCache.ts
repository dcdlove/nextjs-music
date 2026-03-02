/**
 * 歌词缓存服务
 * 使用 localStorage + 内存双重缓存
 */

import { Lyrics } from '../types'

// localStorage key
export const LYRICS_CACHE_KEY = 'lyricsCache'

// 缓存条目类型（带时间戳）
interface CacheEntry {
  data: Lyrics
  timestamp: number
}

// 内存缓存
let memoryCache: Map<string, CacheEntry> | null = null

/**
 * 初始化内存缓存
 * @param forceReload - 是否强制从 localStorage 重新加载
 */
function initMemoryCache(forceReload = false): Map<string, CacheEntry> {
  if (memoryCache && !forceReload) return memoryCache

  memoryCache = new Map()

  // 从 localStorage 加载到内存
  try {
    const stored = localStorage.getItem(LYRICS_CACHE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, CacheEntry>
      for (const [key, entry] of Object.entries(parsed)) {
        memoryCache.set(key, entry)
      }
    }
  } catch (error) {
    console.error('Failed to load lyrics cache from localStorage:', error)
  }

  return memoryCache
}

/**
 * 持久化到 localStorage
 */
function persistToStorage(): void {
  if (typeof window === 'undefined') return

  try {
    const cache = initMemoryCache()
    const obj: Record<string, CacheEntry> = {}
    cache.forEach((value, key) => {
      obj[key] = value
    })
    localStorage.setItem(LYRICS_CACHE_KEY, JSON.stringify(obj))
  } catch (error) {
    console.error('Failed to persist lyrics cache:', error)
  }
}

/**
 * 歌词缓存服务
 */
export const lyricsCache = {
  /**
   * 创建缓存 key
   */
  createKey(singer: string, title: string): string {
    return `lyrics:${singer}:${title}`
  },

  /**
   * 获取缓存
   */
  get(key: string): Lyrics | null {
    try {
      const cache = initMemoryCache()
      const entry = cache.get(key)
      return entry?.data ?? null
    } catch {
      return null
    }
  },

  /**
   * 设置缓存
   */
  set(key: string, lyrics: Lyrics): void {
    try {
      const cache = initMemoryCache()
      cache.set(key, {
        data: lyrics,
        timestamp: Date.now(),
      })
      persistToStorage()
    } catch (error) {
      console.error('Failed to set lyrics cache:', error)
    }
  },

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    const cache = initMemoryCache()
    return cache.has(key)
  },

  /**
   * 删除指定缓存
   */
  remove(key: string): void {
    const cache = initMemoryCache()
    cache.delete(key)
    persistToStorage()
  },

  /**
   * 清空所有缓存
   */
  clear(): void {
    // 重置内存缓存为 null，让下次访问时重新初始化
    memoryCache = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LYRICS_CACHE_KEY)
    }
  },

  /**
   * 获取缓存统计信息
   */
  getStats(): { count: number; size: number } {
    try {
      const cache = initMemoryCache()
      let totalSize = 0

      cache.forEach((entry) => {
        totalSize += JSON.stringify(entry).length
      })

      return {
        count: cache.size,
        size: totalSize,
      }
    } catch {
      return { count: 0, size: 0 }
    }
  },

  /**
   * 清理过期缓存
   *
   * @param days - 保留天数
   * @returns 清理的条目数量
   */
  cleanup(days: number): number {
    // 强制从 localStorage 重新加载
    const cache = initMemoryCache(true)
    const expireTime = Date.now() - days * 24 * 60 * 60 * 1000
    let removedCount = 0

    cache.forEach((entry, key) => {
      if (entry.timestamp < expireTime) {
        cache.delete(key)
        removedCount++
      }
    })

    if (removedCount > 0) {
      persistToStorage()
    }

    return removedCount
  },
}
