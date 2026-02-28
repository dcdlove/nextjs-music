import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Song, SortMode } from '../types'
import { musicApi, ApiError } from '../services/api'
import { ThemeColor } from '../hooks/useThemeColor'

/**
 * 音频分析数据类型
 */
export interface AudioData {
  intensity: number
  bass: number
  high: number
}

/**
 * Store 类型定义
 */
export interface Store {
  // 播放器状态
  audioUrl: string
  isPlaying: boolean
  isPlaylistOpen: boolean
  isSingerListOpen: boolean

  // 音频分析数据（用于 DynamicBackground）
  audioData: AudioData

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

  // 播放器 Actions
  setAudioUrl: (url: string) => void
  setIsPlaying: (playing: boolean) => void
  togglePlay: () => void
  togglePlaylist: () => void
  toggleSingerList: () => void

  // 音频数据 Actions
  setAudioData: (data: AudioData) => void
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
}

// localStorage key
const LIKED_SONGS_KEY = 'likedSongs'

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
    (set, get) => ({
      // ===== 播放器状态 =====

      audioUrl: '', // 初始为空，playlist 加载后自动设置默认曲目
      isPlaying: false,
      isPlaylistOpen: false,
      isSingerListOpen: false,

      // 音频分析数据
      audioData: { intensity: 0, bass: 0, high: 0 },

      // 主题色
      themeColor: null,

      setAudioUrl: (url) => set({ audioUrl: url }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      togglePlaylist: () => set((state) => ({ isPlaylistOpen: !state.isPlaylistOpen })),
      toggleSingerList: () => set((state) => ({ isSingerListOpen: !state.isSingerListOpen })),

      // 音频数据和主题色 Actions
      setAudioData: (data) => set({ audioData: data }),
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
    }),
    {
      name: 'music-player-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)
