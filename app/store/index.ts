import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Song, SortMode, Lyrics, PlayerPersistence } from '../types'
import { musicApi, ApiError } from '../services/api'
import { ThemeColor } from '../hooks/useThemeColor'
import { lyricsApi } from '../services/api/lyrics'
import { lyricsCache } from '../services/lyricsCache'

/**
 * Store 类型定义
 */
export interface Store {
  // 播放器状态
  audioUrl: string
  isPlaying: boolean
  isPlaylistOpen: boolean
  isSingerListOpen: boolean
  currentTime: number
  volume: number

  // 主题色（用于 DynamicBackground）
  themeColor: ThemeColor | null

  // 播放列表状态
  playlist: Song[]
  randomList: Song[]
  isLoading: boolean
  error: string | null

  // 筛选状态
  searchTerm: string
  sortMode: SortMode

  // 喜欢状态
  likedSongs: string[]

  // 歌词状态
  lyrics: Lyrics | null
  currentLyricIndex: number
  isLyricsLoading: boolean
  lyricsError: string | null

  // 播放器 Actions
  setAudioUrl: (url: string) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setVolume: (volume: number) => void
  togglePlay: () => void
  togglePlaylist: () => void
  toggleSingerList: () => void
  setThemeColor: (color: ThemeColor | null) => void

  // 播放列表 Actions
  setPlaylist: (songs: Song[]) => void
  setRandomList: (songs: Song[]) => void
  fetchPlaylist: () => Promise<void>
  playNext: () => void
  playPrev: () => void
  playTrack: (url: string) => void

  // 筛选 Actions
  setSearchTerm: (term: string) => void
  setSortMode: (mode: SortMode) => void

  // 喜欢 Actions
  toggleLike: (url: string) => void
  isLiked: (url: string) => boolean

  // 歌词 Actions
  setLyrics: (lyrics: Lyrics | null) => void
  fetchLyrics: (singer: string, title: string) => Promise<void>
  updateCurrentLyricIndex: (currentTime: number) => void
  setLyricsLoading: (loading: boolean) => void
  setLyricsError: (error: string | null) => void

  // 持久化 Actions
  savePlayerState: () => void
  loadPlayerState: () => PlayerPersistence | null
  clearPlayerState: () => void
}

// localStorage key
const LIKED_SONGS_KEY = 'likedSongs'
const PLAYER_STATE_KEY = 'playerState'

// 持久化过期时间（24小时）
const PLAYER_STATE_EXPIRY = 24 * 60 * 60 * 1000

/**
 * 从 localStorage 加载喜欢的歌曲
 */
const loadLikedSongs = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(LIKED_SONGS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * 保存喜欢的歌曲到 localStorage
 */
const saveLikedSongs = (songs: string[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(songs))
}

/**
 * Fisher-Yates 洗牌算法
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * 创建 Store
 */
export const useStore = create<Store>()(
  devtools(
    (set, get) => {
      return {
      // ===== 播放器状态 =====

      audioUrl: '', // 初始为空，playlist 加载后自动设置默认曲目
      isPlaying: false,
      isPlaylistOpen: false,
      isSingerListOpen: false,
      currentTime: 0,
      volume: 0.8,

      // 主题色
      themeColor: null,

      setAudioUrl: (url) => set({ audioUrl: url }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setVolume: (vol) => set({ volume: vol }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      togglePlaylist: () => set((state) => ({ isPlaylistOpen: !state.isPlaylistOpen })),
      toggleSingerList: () => set((state) => ({ isSingerListOpen: !state.isSingerListOpen })),
      setThemeColor: (color) => set({ themeColor: color }),

      // ===== 播放列表状态 =====
      playlist: [],
      randomList: [],
      isLoading: false,
      error: null,

      setPlaylist: (songs) => set({ playlist: songs, isLoading: false, error: null }),
      setRandomList: (songs) => set({ randomList: songs }),

      fetchPlaylist: async () => {
        set({ isLoading: true, error: null })
        try {
          const songs = await musicApi.fetchPlaylist()
          set({ playlist: songs, isLoading: false })
        } catch (error) {
          const message = error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Unknown error'
          set({ error: message, isLoading: false })
        }
      },

      playTrack: (url) => set({ audioUrl: url, isPlaying: true }),

      playNext: () => {
        const { playlist, randomList, audioUrl, sortMode } = get()
        if (playlist.length === 0) return

        const currentList = sortMode === 'random' ? randomList : playlist
        const listToUse = currentList.length > 0 ? currentList : playlist

        const currentIndex = listToUse.findIndex(
          (item) => decodeURIComponent(item.url) === audioUrl
        )
        const nextIndex = (currentIndex + 1) % listToUse.length

        set({
          audioUrl: decodeURIComponent(listToUse[nextIndex].url),
          isPlaying: true
        })
      },

      playPrev: () => {
        const { playlist, randomList, audioUrl, sortMode } = get()
        if (playlist.length === 0) return

        const currentList = sortMode === 'random' ? randomList : playlist
        const listToUse = currentList.length > 0 ? currentList : playlist

        const currentIndex = listToUse.findIndex(
          (item) => decodeURIComponent(item.url) === audioUrl
        )
        const prevIndex = (currentIndex - 1 + listToUse.length) % listToUse.length

        set({
          audioUrl: decodeURIComponent(listToUse[prevIndex].url),
          isPlaying: true
        })
      },

      // ===== 筛选状态 =====
      searchTerm: '黄霄雲',
      sortMode: 'default',

      setSearchTerm: (term) => set({ searchTerm: term }),
      setSortMode: (mode) => set({ sortMode: mode }),

      // ===== 喜欢状态 =====
      likedSongs: loadLikedSongs(),

      toggleLike: (url) => {
        const decodedUrl = decodeURIComponent(url)
        const { likedSongs } = get()

        const updated = likedSongs.includes(decodedUrl)
          ? likedSongs.filter(id => id !== decodedUrl)
          : [...likedSongs, decodedUrl]

        saveLikedSongs(updated)
        set({ likedSongs: updated })
      },

      isLiked: (url) => {
        const decodedUrl = decodeURIComponent(url)
        return get().likedSongs.includes(decodedUrl)
      },

      // ===== 歌词状态 =====
      lyrics: null,
      currentLyricIndex: -1,
      isLyricsLoading: false,
      lyricsError: null,

      setLyrics: (lyrics) => set({ lyrics, currentLyricIndex: lyrics ? 0 : -1 }),

      fetchLyrics: async (singer, title) => {
        const cacheKey = `${singer}-${title}`

        // 先检查缓存
        const cached = lyricsCache.get(cacheKey)
        if (cached) {
          set({ lyrics: cached, lyricsError: null, isLyricsLoading: false })
          return
        }

        set({ isLyricsLoading: true, lyricsError: null })

        try {
          const result = await lyricsApi.searchLyrics(singer, title)
          if (result) {
            // 保存到缓存
            lyricsCache.set(cacheKey, result)
            set({ lyrics: result, isLyricsLoading: false })
          } else {
            set({ lyrics: null, isLyricsLoading: false, lyricsError: '未找到歌词' })
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : '获取歌词失败'
          set({ lyricsError: message, isLyricsLoading: false })
        }
      },

      updateCurrentLyricIndex: (time) => {
        const { lyrics } = get()
        if (!lyrics || lyrics.syncedLyrics.length === 0) {
          set({ currentLyricIndex: -1 })
          return
        }

        const { syncedLyrics } = lyrics

        // 二分查找当前歌词行
        let left = 0
        let right = syncedLyrics.length - 1
        let index = -1

        while (left <= right) {
          const mid = Math.floor((left + right) / 2)
          if (syncedLyrics[mid].time <= time) {
            index = mid
            left = mid + 1
          } else {
            right = mid - 1
          }
        }

        set({ currentLyricIndex: index })
      },

      setLyricsLoading: (loading) => set({ isLyricsLoading: loading }),
      setLyricsError: (error) => set({ lyricsError: error }),

      // ===== 持久化 Actions =====
      savePlayerState: () => {
        if (typeof window === 'undefined') return

        const { audioUrl, isPlaying, currentTime, volume } = get()
        const state: PlayerPersistence = {
          audioUrl,
          isPlaying,
          currentTime,
          volume,
          timestamp: Date.now(),
        }

        localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(state))
      },

      loadPlayerState: () => {
        if (typeof window === 'undefined') return null

        try {
          const stored = localStorage.getItem(PLAYER_STATE_KEY)
          if (!stored) return null

          const state: PlayerPersistence = JSON.parse(stored)

          // 检查是否过期（超过24小时）
          if (Date.now() - state.timestamp > PLAYER_STATE_EXPIRY) {
            localStorage.removeItem(PLAYER_STATE_KEY)
            return null
          }

          return state
        } catch {
          return null
        }
      },

      clearPlayerState: () => {
        if (typeof window === 'undefined') return
        localStorage.removeItem(PLAYER_STATE_KEY)
      },
    }},
    {
      name: 'music-player-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)
