/**
 * 歌手头像服务
 * 读取服务端远程映射并做前端缓存
 */

export interface SingerAvatarResult {
  /** 歌手名 */
  name: string
  /** 头像 URL */
  url: string
  /** 来源 */
  source: 'local' | 'fallback'
}

export interface AvatarCache {
  get(name: string): SingerAvatarResult | null
  set(name: string, result: SingerAvatarResult): void
  has(name: string): boolean
  clear(): void
}

/**
 * 默认头像（当找不到时使用）
 */
export const DEFAULT_AVATAR = '/default-avatar.svg'

// 远程头像映射缓存
let localAvatarMap: Record<string, string> | null = null
let localAvatarMapLoadedAt = 0
const AVATAR_MAP_CACHE_TTL_MS = 60 * 1000

function normalizeAvatarMap(input: unknown): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {}
  }

  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (typeof key === 'string' && typeof value === 'string' && key.trim() && value.trim()) {
      result[key.trim()] = value.trim()
    }
  }
  return result
}

/**
 * 加载远程头像映射
 */
async function loadAvatarMap(): Promise<Record<string, string>> {
  if (localAvatarMap && (Date.now() - localAvatarMapLoadedAt) < AVATAR_MAP_CACHE_TTL_MS) {
    return localAvatarMap
  }

  try {
    const response = await fetch('/api/singer-avatars', { cache: 'no-store' })
    if (response.ok) {
      const parsed = await response.json()
      localAvatarMap = normalizeAvatarMap(parsed)
      localAvatarMapLoadedAt = Date.now()
      return localAvatarMap || {}
    }
  } catch {
    // 加载失败，返回空对象
  }
  return localAvatarMap || {}
}

/**
 * 创建内存缓存
 */
export function createMemoryCache(): AvatarCache {
  const cache = new Map<string, SingerAvatarResult>()

  return {
    get: (name: string) => cache.get(name) || null,
    set: (name: string, result: SingerAvatarResult) => cache.set(name, result),
    has: (name: string) => cache.has(name),
    clear: () => cache.clear()
  }
}

/**
 * 规范化歌手名（去除首尾空格）
 */
function normalizeSingerName(name: string): string {
  return name.trim()
}

/**
 * 创建歌手头像服务
 * @param cache 可选的缓存实现，默认使用内存缓存
 */
export function createSingerAvatarService(cache: AvatarCache = createMemoryCache()) {
  return {
    async getAvatar(singerName: string): Promise<SingerAvatarResult> {
      const normalizedName = normalizeSingerName(singerName)

      // 检查缓存
      if (cache.has(normalizedName)) {
        return cache.get(normalizedName)!
      }

      // 尝试从远程映射获取
      try {
        const avatarMap = await loadAvatarMap()
        const localAvatar = avatarMap[normalizedName]
        if (localAvatar) {
          const result: SingerAvatarResult = {
            name: normalizedName,
            url: localAvatar,
            source: 'local'
          }
          cache.set(normalizedName, result)
          return result
        }
      } catch {
        // 本地配置加载失败
      }

      // 返回默认头像
      const result: SingerAvatarResult = {
        name: normalizedName,
        url: DEFAULT_AVATAR,
        source: 'fallback'
      }
      cache.set(normalizedName, result)
      return result
    },

    async getAvatars(singerNames: string[]): Promise<Map<string, SingerAvatarResult>> {
      const results = new Map<string, SingerAvatarResult>()

      await Promise.all(
        singerNames.map(async (name) => {
          const result = await this.getAvatar(name)
          results.set(name, result)
        })
      )

      return results
    },

    async preloadAvatars(singerNames: string[]): Promise<void> {
      await this.getAvatars(singerNames)
    },

    clearCache(): void {
      cache.clear()
      localAvatarMap = null
      localAvatarMapLoadedAt = 0
    }
  }
}
