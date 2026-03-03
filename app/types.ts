export interface Song {
  singer: string;
  title: string;
  ext: string;
  url: string;
  url2?: string;
  null?: boolean;
}

export type SortMode = 'default' | 'liked';

/**
 * LRC 歌词行
 */
export interface LyricLine {
  time: number;      // 时间（秒）
  text: string;      // 歌词文本
}

/**
 * 歌词数据
 */
export interface Lyrics {
  id: string;            // 歌词 ID
  singer: string;        // 歌手名
  title: string;         // 歌曲名
  plainLyrics: string;   // 纯文本歌词
  syncedLyrics: LyricLine[];  // 同步歌词（带时间戳）
  source: string;        // 来源
}

/**
 * 播放状态持久化数据
 */
export interface PlayerPersistence {
  audioUrl: string;      // 当前曲目 URL
  currentTime: number;   // 播放进度（秒）
  isPlaying: boolean;    // 播放状态
  volume: number;        // 音量
  timestamp: number;     // 保存时间戳（用于判断是否过期）
}
