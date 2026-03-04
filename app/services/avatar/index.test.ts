import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createMemoryCache,
  SingerAvatarResult,
  DEFAULT_AVATAR
} from './index'

// 模拟 fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AvatarCache', () => {
  let cache: ReturnType<typeof createMemoryCache>

  beforeEach(() => {
    cache = createMemoryCache()
  })

  it('should return null for non-existent key', () => {
    expect(cache.get('unknown')).toBeNull()
  })

  it('should set and get value', () => {
    const result: SingerAvatarResult = {
      name: '周杰伦',
      url: 'https://example.com/avatar.jpg',
      source: 'local'
    }
    cache.set('周杰伦', result)
    expect(cache.get('周杰伦')).toEqual(result)
  })

  it('should check if key exists', () => {
    expect(cache.has('周杰伦')).toBe(false)
    cache.set('周杰伦', {
      name: '周杰伦',
      url: 'https://example.com/avatar.jpg',
      source: 'local'
    })
    expect(cache.has('周杰伦')).toBe(true)
  })

  it('should clear all entries', () => {
    cache.set('周杰伦', {
      name: '周杰伦',
      url: 'https://example.com/avatar.jpg',
      source: 'local'
    })
    cache.clear()
    expect(cache.has('周杰伦')).toBe(false)
  })
})

describe('DEFAULT_AVATAR', () => {
  it('should be a valid path', () => {
    expect(DEFAULT_AVATAR).toBe('/default-avatar.svg')
  })
})

describe('createSingerAvatarService', () => {
  // 动态导入以避免顶层依赖问题
  let createSingerAvatarService: typeof import('./index').createSingerAvatarService

  beforeEach(async () => {
    // 重置模块和 mock
    vi.resetModules()
    mockFetch.mockReset()

    // 重新导入
    const module = await import('./index')
    createSingerAvatarService = module.createSingerAvatarService
  })

  describe('getAvatar', () => {
    it('should return local avatar from api map', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ 周杰伦: 'https://example.com/jay.jpg' }),
      })

      const service = createSingerAvatarService()
      const result = await service.getAvatar('周杰伦')

      expect(mockFetch).toHaveBeenCalledWith('/api/singer-avatars', { cache: 'no-store' })
      expect(result.name).toBe('周杰伦')
      expect(result.url).toBe('https://example.com/jay.jpg')
      expect(result.source).toBe('local')
    })

    it('should return fallback avatar when no local config and API fails', async () => {
      // 模拟 API 失败
      mockFetch.mockRejectedValue(new Error('Network error'))

      const service = createSingerAvatarService()
      const result = await service.getAvatar('未知歌手')

      expect(result.name).toBe('未知歌手')
      expect(result.url).toBe(DEFAULT_AVATAR)
      expect(result.source).toBe('fallback')
    })

    it('should cache the result', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const service = createSingerAvatarService()

      // 第一次调用
      await service.getAvatar('周杰伦')
      // 第二次调用应该使用缓存
      const result = await service.getAvatar('周杰伦')

      expect(result.name).toBe('周杰伦')
      // fetch 只应该被调用一次（第二次使用缓存）
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should normalize singer name for lookup', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const service = createSingerAvatarService()

      // 带空格的歌手名应该能正确处理
      const result1 = await service.getAvatar('  周杰伦  ')
      const result2 = await service.getAvatar('周杰伦')

      // 两个应该返回相同结果（使用同一缓存）
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('getAvatars', () => {
    it('should return map of avatars for multiple singers', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const service = createSingerAvatarService()
      const results = await service.getAvatars(['周杰伦', '林俊杰'])

      expect(results.size).toBe(2)
      expect(results.has('周杰伦')).toBe(true)
      expect(results.has('林俊杰')).toBe(true)
    })
  })

  describe('clearCache', () => {
    it('should clear all cached avatars', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const service = createSingerAvatarService()

      await service.getAvatar('周杰伦')
      service.clearCache()
      await service.getAvatar('周杰伦')

      // 清除缓存后应该重新请求
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})
