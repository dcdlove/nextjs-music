/**
 * 歌手头像服务
 * 优先使用本地配置，避免外部 API 调用
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

// 本地头像映射缓存
let localAvatarMap: Record<string, string> | null = null

/**
 * 加载本地头像映射
 */
async function loadLocalAvatarMap(): Promise<Record<string, string>> {
  if (localAvatarMap) return localAvatarMap

  try {
    const response = await fetch('/singer-avatars.json')
    if (response.ok) {
      localAvatarMap = await response.json()
      return localAvatarMap || {}
    }
  } catch {
    // 加载失败，返回空对象
  }
  return {}
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

      // 尝试从本地配置获取
      try {
        const avatarMap = await loadLocalAvatarMap()
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
    }
  }
}
