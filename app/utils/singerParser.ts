import { Song } from '../types'

/**
 * 歌手分隔符列表
 * 支持多种分隔符：& 、，, and 和 与
 */
const SINGER_SEPARATORS = [
  /\s*&\s*/,      // & (带可选空格)
  /\s*、\s*/,     // 中文顿号
  /\s*，\s*/,     // 中文逗号
  /\s*,\s*/,      // 英文逗号
  /\s+and\s+/i,   // and (英文)
  /\s*和\s*/,     // 和 (中文)
  /\s*与\s*/,     // 与 (中文)
] as const

/**
 * 解析歌手字符串，拆分为独立的歌手名称数组
 *
 * @param singerString - 原始歌手字符串，可能包含多个歌手
 * @returns 拆分后的独立歌手名称数组（去重）
 *
 * @example
 * parseSingers('黄霄雲') // ['黄霄雲']
 * parseSingers('伊兔&钱小坏') // ['伊兔', '钱小坏']
 * parseSingers('歌手A, 歌手B & 歌手C') // ['歌手A', '歌手B', '歌手C']
 */
export function parseSingers(singerString: string): string[] {
  // 处理空字符串或纯空格
  if (!singerString || !singerString.trim()) {
    return []
  }

  let result = [singerString.trim()]

  // 依次应用每个分隔符进行拆分
  for (const separator of SINGER_SEPARATORS) {
    result = result.flatMap(s => s.split(separator))
  }

  // 清理结果：去除空白、过滤空字符串、去重
  return [...new Set(
    result
      .map(s => s.trim())
      .filter(s => s.length > 0)
  )]
}

/**
 * 从歌曲列表中提取所有独立的歌手名称
 *
 * @param songs - 歌曲列表
 * @returns 排序后的独立歌手名称数组
 *
 * @example
 * const songs = [
 *   { singer: '黄霄雲', ... },
 *   { singer: '伊兔&钱小坏', ... },
 * ]
 * extractSingersFromSongs(songs) // ['伊兔', '钱小坏', '黄霄雲']
 */
export function extractSingersFromSongs(songs: Song[]): string[] {
  const singersSet = new Set<string>()

  for (const song of songs) {
    const parsedSingers = parseSingers(song.singer)
    for (const singer of parsedSingers) {
      singersSet.add(singer)
    }
  }

  // 返回排序后的数组
  return [...singersSet].sort()
}
