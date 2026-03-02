import { describe, it, expect } from 'vitest'
import { parseSingers, extractSingersFromSongs } from './singerParser'
import { Song } from '../types'

describe('singerParser', () => {
  describe('parseSingers', () => {
    it('should return single singer when no separator', () => {
      const result = parseSingers('黄霄雲')
      expect(result).toEqual(['黄霄雲'])
    })

    it('should split singers by "&" separator', () => {
      const result = parseSingers('伊兔&钱小坏')
      expect(result).toEqual(['伊兔', '钱小坏'])
    })

    it('should split multiple singers by "&"', () => {
      const result = parseSingers('歌手A&歌手B&歌手C')
      expect(result).toEqual(['歌手A', '歌手B', '歌手C'])
    })

    it('should trim whitespace from singer names', () => {
      const result = parseSingers('歌手A & 歌手B')
      expect(result).toEqual(['歌手A', '歌手B'])
    })

    it('should handle mixed separators ("&" and "、")', () => {
      const result = parseSingers('歌手A&歌手B、歌手C')
      expect(result).toEqual(['歌手A', '歌手B', '歌手C'])
    })

    it('should handle mixed separators ("&" and ",")', () => {
      const result = parseSingers('歌手A, 歌手B & 歌手C')
      expect(result).toEqual(['歌手A', '歌手B', '歌手C'])
    })

    it('should handle Chinese comma separator', () => {
      const result = parseSingers('歌手A，歌手B')
      expect(result).toEqual(['歌手A', '歌手B'])
    })

    it('should handle English comma separator', () => {
      const result = parseSingers('Singer A, Singer B')
      expect(result).toEqual(['Singer A', 'Singer B'])
    })

    it('should handle "and" as separator', () => {
      const result = parseSingers('Jay Chou and Coco Lee')
      expect(result).toEqual(['Jay Chou', 'Coco Lee'])
    })

    it('should handle "和" as separator', () => {
      const result = parseSingers('张三和李四')
      expect(result).toEqual(['张三', '李四'])
    })

    it('should handle "与" as separator', () => {
      const result = parseSingers('张三与李四')
      expect(result).toEqual(['张三', '李四'])
    })

    it('should return empty array for empty string', () => {
      const result = parseSingers('')
      expect(result).toEqual([])
    })

    it('should return empty array for whitespace only', () => {
      const result = parseSingers('   ')
      expect(result).toEqual([])
    })

    it('should filter out empty strings from result', () => {
      const result = parseSingers('歌手A && 歌手B')
      expect(result).toEqual(['歌手A', '歌手B'])
    })

    it('should deduplicate singers', () => {
      const result = parseSingers('歌手A&歌手B&歌手A')
      expect(result).toEqual(['歌手A', '歌手B'])
    })
  })

  describe('extractSingersFromSongs', () => {
    const mockSongs: Song[] = [
      { singer: '黄霄雲', title: '歌曲1', url: 'url1', ext: '.mp3' },
      { singer: '伊兔&钱小坏', title: '歌曲2', url: 'url2', ext: '.mp3' },
      { singer: '歌手A, 歌手B', title: '歌曲3', url: 'url3', ext: '.mp3' },
      { singer: '黄霄雲', title: '歌曲4', url: 'url4', ext: '.mp3' }, // 重复歌手
      { singer: '张三与李四', title: '歌曲5', url: 'url5', ext: '.mp3' },
    ]

    it('should extract unique singers from songs', () => {
      const result = extractSingersFromSongs(mockSongs)

      // 应该包含拆分后的独立歌手
      expect(result).toContain('黄霄雲')
      expect(result).toContain('伊兔')
      expect(result).toContain('钱小坏')
      expect(result).toContain('歌手A')
      expect(result).toContain('歌手B')
      expect(result).toContain('张三')
      expect(result).toContain('李四')
    })

    it('should deduplicate singers across songs', () => {
      const result = extractSingersFromSongs(mockSongs)

      // 黄霄雲出现两次，但结果中只应有一个
      const huangXiaoyuCount = result.filter(s => s === '黄霄雲').length
      expect(huangXiaoyuCount).toBe(1)
    })

    it('should return sorted array', () => {
      const result = extractSingersFromSongs(mockSongs)

      // 结果应该是排序后的数组
      const sorted = [...result].sort()
      expect(result).toEqual(sorted)
    })

    it('should return empty array for empty songs', () => {
      const result = extractSingersFromSongs([])
      expect(result).toEqual([])
    })

    it('should handle song with null singer', () => {
      const songsWithNull = [
        { singer: '', title: '歌曲', url: 'url', ext: '.mp3' },
        ...mockSongs,
      ]
      const result = extractSingersFromSongs(songsWithNull)

      // 空字符串不应该出现在结果中
      expect(result).not.toContain('')
    })
  })
})
