import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import { useStore } from './index'
import { Lyrics } from '../types'

// 模拟 lyricsApi
vi.mock('../services/api/lyrics', () => ({
  lyricsApi: {
    searchLyrics: vi.fn(),
  },
}))

// 模拟 lyricsCache
vi.mock('../services/lyricsCache', () => ({
  lyricsCache: {
    createKey: vi.fn((singer, title) => `lyrics:${singer}:${title}`),
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
    has: vi.fn(),
  },
  LYRICS_CACHE_KEY: 'lyricsCache',
}))

describe('useStore', () => {
  beforeEach(() => {
    // 重置 store 到初始状态
    useStore.setState({
      audioUrl: '',
      isPlaying: false,
      isPlaylistOpen: false,
      playlist: [],
      isLoading: false,
      error: null,
      searchTerm: '',
      sortMode: 'default',
      likedSongs: [],
      // 歌词状态
      lyrics: null,
      currentLyricIndex: -1,
      isLyricsLoading: false,
      lyricsError: null,
      // 播放状态持久化
      currentTime: 0,
      volume: 1,
    })
    // 清空 localStorage
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('播放器状态', () => {
    it('setAudioUrl 更新音频 URL', () => {
      act(() => {
        useStore.getState().setAudioUrl('https://example.com/song.mp3')
      })

      expect(useStore.getState().audioUrl).toBe('https://example.com/song.mp3')
    })

    it('setIsPlaying 更新播放状态', () => {
      act(() => {
        useStore.getState().setIsPlaying(true)
      })

      expect(useStore.getState().isPlaying).toBe(true)
    })

    it('togglePlay 切换播放状态', () => {
      expect(useStore.getState().isPlaying).toBe(false)

      act(() => {
        useStore.getState().togglePlay()
      })

      expect(useStore.getState().isPlaying).toBe(true)

      act(() => {
        useStore.getState().togglePlay()
      })

      expect(useStore.getState().isPlaying).toBe(false)
    })

    it('togglePlaylist 切换播放列表显示', () => {
      expect(useStore.getState().isPlaylistOpen).toBe(false)

      act(() => {
        useStore.getState().togglePlaylist()
      })

      expect(useStore.getState().isPlaylistOpen).toBe(true)
    })
  })

  describe('播放列表操作', () => {
    const mockSongs = [
      { singer: 'Artist1', title: 'Song1', ext: '.mp3', url: 'url1' },
      { singer: 'Artist2', title: 'Song2', ext: '.mp3', url: 'url2' },
      { singer: 'Artist3', title: 'Song3', ext: '.mp3', url: 'url3' },
    ]

    it('setPlaylist 更新播放列表', () => {
      act(() => {
        useStore.getState().setPlaylist(mockSongs)
      })

      expect(useStore.getState().playlist).toEqual(mockSongs)
      expect(useStore.getState().isLoading).toBe(false)
      expect(useStore.getState().error).toBeNull()
    })

    it('playTrack 设置音频 URL 并开始播放', () => {
      act(() => {
        useStore.getState().playTrack('new-url')
      })

      expect(useStore.getState().audioUrl).toBe('new-url')
      expect(useStore.getState().isPlaying).toBe(true)
    })

    it('playNext 播放下一首', () => {
      act(() => {
        useStore.getState().setPlaylist(mockSongs)
        useStore.getState().setAudioUrl('url1')
      })

      act(() => {
        useStore.getState().playNext()
      })

      expect(useStore.getState().audioUrl).toBe('url2')
    })

    it('playPrev 播放上一首', () => {
      act(() => {
        useStore.getState().setPlaylist(mockSongs)
        useStore.getState().setAudioUrl('url2')
      })

      act(() => {
        useStore.getState().playPrev()
      })

      expect(useStore.getState().audioUrl).toBe('url1')
    })

    it('playNext 在最后一首时循环到第一首', () => {
      act(() => {
        useStore.getState().setPlaylist(mockSongs)
        useStore.getState().setAudioUrl('url3')
      })

      act(() => {
        useStore.getState().playNext()
      })

      expect(useStore.getState().audioUrl).toBe('url1')
    })

    it('playPrev 在第一首时循环到最后一首', () => {
      act(() => {
        useStore.getState().setPlaylist(mockSongs)
        useStore.getState().setAudioUrl('url1')
      })

      act(() => {
        useStore.getState().playPrev()
      })

      expect(useStore.getState().audioUrl).toBe('url3')
    })
  })

  describe('筛选状态', () => {
    it('setSearchTerm 更新搜索词', () => {
      act(() => {
        useStore.getState().setSearchTerm('test search')
      })

      expect(useStore.getState().searchTerm).toBe('test search')
    })

    it('setSortMode 更新排序模式', () => {
      act(() => {
        useStore.getState().setSortMode('liked')
      })

      expect(useStore.getState().sortMode).toBe('liked')
    })
  })

  describe('喜欢功能', () => {
    it('toggleLike 添加喜欢的歌曲', () => {
      act(() => {
        useStore.getState().toggleLike('song-url-1')
      })

      expect(useStore.getState().likedSongs).toContain('song-url-1')
    })

    it('toggleLike 移除已喜欢的歌曲', () => {
      act(() => {
        useStore.getState().toggleLike('song-url-1')
        useStore.getState().toggleLike('song-url-1')
      })

      expect(useStore.getState().likedSongs).not.toContain('song-url-1')
    })

    it('isLiked 返回正确的喜欢状态', () => {
      act(() => {
        useStore.getState().toggleLike('song-url-1')
      })

      expect(useStore.getState().isLiked('song-url-1')).toBe(true)
      expect(useStore.getState().isLiked('song-url-2')).toBe(false)
    })

    it('持久化到 localStorage', () => {
      act(() => {
        useStore.getState().toggleLike('song-url-1')
      })

      const stored = JSON.parse(localStorage.getItem('likedSongs') || '[]')
      expect(stored).toContain('song-url-1')
    })
  })

  describe('歌词状态', () => {
    const mockLyrics: Lyrics = {
      id: '123',
      singer: 'Test Artist',
      title: 'Test Song',
      plainLyrics: 'Plain lyrics',
      syncedLyrics: [
        { time: 0, text: 'Line 1' },
        { time: 10, text: 'Line 2' },
        { time: 20, text: 'Line 3' },
      ],
      source: 'lrclib',
    }

    it('setLyrics 更新歌词', () => {
      act(() => {
        useStore.getState().setLyrics(mockLyrics)
      })

      expect(useStore.getState().lyrics).toEqual(mockLyrics)
    })

    it('setLyrics 传入 null 清空歌词', () => {
      act(() => {
        useStore.getState().setLyrics(mockLyrics)
      })

      act(() => {
        useStore.getState().setLyrics(null)
      })

      expect(useStore.getState().lyrics).toBeNull()
    })

    it('updateCurrentLyricIndex 根据时间更新索引', () => {
      act(() => {
        useStore.getState().setLyrics(mockLyrics)
      })

      // 时间在第一句之前
      act(() => {
        useStore.getState().updateCurrentLyricIndex(0)
      })
      expect(useStore.getState().currentLyricIndex).toBe(0)

      // 时间在第一句和第二句之间
      act(() => {
        useStore.getState().updateCurrentLyricIndex(5)
      })
      expect(useStore.getState().currentLyricIndex).toBe(0)

      // 时间在第二句和第三句之间
      act(() => {
        useStore.getState().updateCurrentLyricIndex(15)
      })
      expect(useStore.getState().currentLyricIndex).toBe(1)

      // 时间在第三句之后
      act(() => {
        useStore.getState().updateCurrentLyricIndex(25)
      })
      expect(useStore.getState().currentLyricIndex).toBe(2)
    })

    it('updateCurrentLyricIndex 没有歌词时返回 -1', () => {
      act(() => {
        useStore.getState().updateCurrentLyricIndex(10)
      })

      expect(useStore.getState().currentLyricIndex).toBe(-1)
    })

    it('setLyricsLoading 更新加载状态', () => {
      act(() => {
        useStore.getState().setLyricsLoading(true)
      })

      expect(useStore.getState().isLyricsLoading).toBe(true)
    })

    it('setLyricsError 更新错误状态', () => {
      act(() => {
        useStore.getState().setLyricsError('Failed to fetch')
      })

      expect(useStore.getState().lyricsError).toBe('Failed to fetch')
    })
  })

  describe('播放状态持久化', () => {
    it('savePlayerState 保存到 localStorage', () => {
      act(() => {
        useStore.getState().setAudioUrl('https://example.com/song.mp3')
        useStore.getState().setIsPlaying(true)
        useStore.getState().setCurrentTime(120.5)
        useStore.getState().setVolume(0.8)
      })

      act(() => {
        useStore.getState().savePlayerState()
      })

      const stored = JSON.parse(localStorage.getItem('playerState') || '{}')
      expect(stored.audioUrl).toBe('https://example.com/song.mp3')
      expect(stored.isPlaying).toBe(true)
      expect(stored.currentTime).toBe(120.5)
      expect(stored.volume).toBe(0.8)
      expect(stored.timestamp).toBeDefined()
    })

    it('loadPlayerState 从 localStorage 恢复状态', () => {
      // 先保存一个状态
      const savedState = {
        audioUrl: 'https://example.com/saved.mp3',
        currentTime: 60,
        isPlaying: false,
        volume: 0.5,
        timestamp: Date.now(),
      }
      localStorage.setItem('playerState', JSON.stringify(savedState))

      const loaded = useStore.getState().loadPlayerState()

      expect(loaded).not.toBeNull()
      expect(loaded?.audioUrl).toBe('https://example.com/saved.mp3')
      expect(loaded?.currentTime).toBe(60)
      expect(loaded?.volume).toBe(0.5)
    })

    it('loadPlayerState 超过 24 小时的状态返回 null', () => {
      const expiredState = {
        audioUrl: 'https://example.com/expired.mp3',
        currentTime: 30,
        isPlaying: false,
        volume: 1,
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 小时前
      }
      localStorage.setItem('playerState', JSON.stringify(expiredState))

      const loaded = useStore.getState().loadPlayerState()

      expect(loaded).toBeNull()
    })

    it('loadPlayerState 没有保存状态时返回 null', () => {
      const loaded = useStore.getState().loadPlayerState()
      expect(loaded).toBeNull()
    })

    it('clearPlayerState 清除保存的状态', () => {
      act(() => {
        useStore.getState().setAudioUrl('https://example.com/song.mp3')
        useStore.getState().savePlayerState()
      })

      act(() => {
        useStore.getState().clearPlayerState()
      })

      expect(localStorage.getItem('playerState')).toBeNull()
    })

    it('setCurrentTime 更新播放进度', () => {
      act(() => {
        useStore.getState().setCurrentTime(45.5)
      })

      expect(useStore.getState().currentTime).toBe(45.5)
    })

    it('setVolume 更新音量', () => {
      act(() => {
        useStore.getState().setVolume(0.5)
      })

      expect(useStore.getState().volume).toBe(0.5)
    })
  })
})
