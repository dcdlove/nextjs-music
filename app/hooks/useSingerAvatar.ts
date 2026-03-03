'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  createSingerAvatarService,
  SingerAvatarResult,
  SingerAvatarService,
  createMemoryCache
} from '../services/avatar'

// 全局缓存，避免重复创建
const globalCache = createMemoryCache()
const globalService = createSingerAvatarService(globalCache)

/**
 * 获取单个歌手头像的 Hook
 */
export function useSingerAvatar(singerName: string) {
  const [avatar, setAvatar] = useState<SingerAvatarResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!singerName) {
      setAvatar(null)
      return
    }

    setLoading(true)

    globalService.getAvatar(singerName).then((result) => {
      setAvatar(result)
      setLoading(false)
    })
  }, [singerName])

  return { avatar, loading }
}

/**
 * 批量获取歌手头像的 Hook
 */
export function useSingerAvatars(singerNames: string[]) {
  const [avatars, setAvatars] = useState<Map<string, SingerAvatarResult>>(new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (singerNames.length === 0) {
      setAvatars(new Map())
      return
    }

    setLoading(true)

    globalService.getAvatars(singerNames).then((results) => {
      setAvatars(results)
      setLoading(false)
    })
  }, [singerNames.join(',')]) // 依赖歌手名列表

  return { avatars, loading }
}

/**
 * 获取头像服务的 Hook（用于高级用法）
 */
export function useAvatarService(): SingerAvatarService {
  return globalService
}

/**
 * 生成基于歌手名的渐变色（当没有真实头像时的备选方案）
 */
export function useSingerGradient(singerName: string): string {
  return useMemo(() => {
    if (!singerName) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

    // 基于歌手名生成稳定的颜色
    const hash = singerName.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0)
    }, 0)

    const hue1 = (hash * 137) % 360 // 使用黄金角度分布
    const hue2 = (hue1 + 40) % 360

    return `linear-gradient(135deg, hsl(${hue1}, 70%, 50%) 0%, hsl(${hue2}, 70%, 40%) 100%)`
  }, [singerName])
}
