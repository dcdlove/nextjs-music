import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { useStore, shuffleArray } from './index'

describe('shuffleArray', () => {
  it('返回新数组（不修改原数组）', () => {
    const original = [1, 2, 3, 4, 5]
    const shuffled = shuffleArray(original)

    expect(original).toEqual([1, 2, 3, 4, 5])
    expect(shuffled).not.toBe(original)
  })

  it('保留所有元素', () => {
    const original = [1, 2, 3, 4, 5]
    const shuffled = shuffleArray(original)

    expect(shuffled.sort()).toEqual(original.sort())
  })

  it('处理空数组', () => {
    expect(shuffleArray([])).toEqual([])
  })

  it('处理单元素数组', () => {
    expect(shuffleArray([1])).toEqual([1])
  })
})

describe('useStore', () => {
  beforeEach(() => {
    // 重置 store 到初始状态
    useStore.setState({
      audioUrl: '',
      isPlaying: false,
      isPlaylistOpen: false,
      playlist: [],
      randomList: [],
      isLoading: false,
      error: null,
      searchTerm: '',
      sortMode: 'default',
      likedSongs: [],
    })
    // 清空 localStorage
    localStorage.clear()
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
        useStore.getState().setSortMode('random')
      })

      expect(useStore.getState().sortMode).toBe('random')
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
})
