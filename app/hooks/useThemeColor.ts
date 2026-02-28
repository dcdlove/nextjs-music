import { useMemo } from 'react';

/**
 * 情绪-色彩映射系统
 * 基于歌曲信息生成独特的主题色
 */

// 情绪类型定义
export type MoodType =
  | 'passionate'  // 热血 - 摇滚、电子
  | 'romantic'    // 浪漫 - 情歌、R&B
  | 'melancholy'  // 忧伤 - 抒情、民谣
  | 'energetic'   // 活力 - 流行、舞曲
  | 'mysterious'  // 神秘 - 古典、氛围
  | 'dreamy'      // 梦幻 - 电子、后摇
  | 'nostalgic'   // 怀旧 - 爵士、老歌
  | 'pure';       // 纯净 - 古典、纯音乐

// 情绪调色板
const MOOD_PALETTES: Record<MoodType, {
  primary: string;
  primaryRgb: string;
  secondary: string;
  analogous1: string;
  gradient: string;
  glowStrong: string;
  hue: number;
}> = {
  passionate: {
    primary: '#ef4444',
    primaryRgb: '239, 68, 68',
    secondary: '#f97316',
    analogous1: '#f97316',
    gradient: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #451a03 100%)',
    glowStrong: 'rgba(239, 68, 68, 0.7)',
    hue: 0,
  },
  romantic: {
    primary: '#ec4899',
    primaryRgb: '236, 72, 153',
    secondary: '#fb7185',
    analogous1: '#fb7185',
    gradient: 'linear-gradient(135deg, #500724 0%, #831843 50%, #881337 100%)',
    glowStrong: 'rgba(236, 72, 153, 0.7)',
    hue: 330,
  },
  melancholy: {
    primary: '#7c3aed',
    primaryRgb: '124, 58, 237',
    secondary: '#4f46e5',
    analogous1: '#4f46e5',
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #2e1065 100%)',
    glowStrong: 'rgba(124, 58, 237, 0.7)',
    hue: 258,
  },
  energetic: {
    primary: '#10b981',
    primaryRgb: '16, 185, 129',
    secondary: '#eab308',
    analogous1: '#eab308',
    gradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #422006 100%)',
    glowStrong: 'rgba(16, 185, 129, 0.7)',
    hue: 160,
  },
  mysterious: {
    primary: '#6b21a8',
    primaryRgb: '107, 33, 168',
    secondary: '#1e40af',
    analogous1: '#1e40af',
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #172554 100%)',
    glowStrong: 'rgba(107, 33, 168, 0.7)',
    hue: 275,
  },
  dreamy: {
    primary: '#06b6d4',
    primaryRgb: '6, 182, 212',
    secondary: '#22d3ee',
    analogous1: '#22d3ee',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #164e63 50%, #155e75 100%)',
    glowStrong: 'rgba(6, 182, 212, 0.7)',
    hue: 187,
  },
  nostalgic: {
    primary: '#a16207',
    primaryRgb: '161, 98, 7',
    secondary: '#d97706',
    analogous1: '#d97706',
    gradient: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #451a03 100%)',
    glowStrong: 'rgba(161, 98, 7, 0.7)',
    hue: 42,
  },
  pure: {
    primary: '#94a3b8',
    primaryRgb: '148, 163, 184',
    secondary: '#93c5fd',
    analogous1: '#93c5fd',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e3a8a 100%)',
    glowStrong: 'rgba(148, 163, 184, 0.6)',
    hue: 215,
  },
};

// 扩展的高级感预设调色板（向后兼容）
const LEGACY_PALETTES = [
  // 1. 赛博霓虹 (Cyber Neon) - 青/紫
  {
    primary: '#22d3ee',
    primaryRgb: '34, 211, 238',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #312e81 100%)',
    secondary: '#a855f7',
    analogous1: '#a855f7',
    glowStrong: 'rgba(34, 211, 238, 0.8)',
  },
  // 2. 黑金奢华 (Midnight Gold) - 金/黑
  {
    primary: '#fbbf24',
    primaryRgb: '251, 191, 36',
    gradient: 'linear-gradient(135deg, #1c1917 0%, #451a03 100%)',
    secondary: '#f59e0b',
    analogous1: '#f59e0b',
    glowStrong: 'rgba(251, 191, 36, 0.6)',
  },
  // 3. 极光幻境 (Aurora) - 绿/蓝
  {
    primary: '#34d399',
    primaryRgb: '52, 211, 153',
    gradient: 'linear-gradient(135deg, #022c22 0%, #115e59 100%)',
    secondary: '#2dd4bf',
    analogous1: '#2dd4bf',
    glowStrong: 'rgba(52, 211, 153, 0.6)',
  },
  // 4. 绯红女巫 (Scarlet Witch) - 红/暗红
  {
    primary: '#f87171',
    primaryRgb: '248, 113, 113',
    gradient: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)',
    secondary: '#ef4444',
    analogous1: '#ef4444',
    glowStrong: 'rgba(248, 113, 113, 0.6)',
  },
  // 5. 深海幽蓝 (Deep Ocean) - 蓝/深蓝
  {
    primary: '#60a5fa',
    primaryRgb: '96, 165, 250',
    gradient: 'linear-gradient(135deg, #172554 0%, #1e3a8a 100%)',
    secondary: '#3b82f6',
    analogous1: '#3b82f6',
    glowStrong: 'rgba(96, 165, 250, 0.6)',
  },
  // 6. 梦幻紫罗兰 (Dreamy Violet) - 紫/粉
  {
    primary: '#c084fc',
    primaryRgb: '192, 132, 252',
    gradient: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 100%)',
    secondary: '#e879f9',
    analogous1: '#e879f9',
    glowStrong: 'rgba(192, 132, 252, 0.6)',
  },
  // 7. 鎏金岁月 (Golden Era) - 金/琥珀
  {
    primary: '#f59e0b',
    primaryRgb: '245, 158, 11',
    gradient: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #422006 100%)',
    secondary: '#fbbf24',
    analogous1: '#fbbf24',
    glowStrong: 'rgba(245, 158, 11, 0.7)',
  },
  // 8. 翡翠迷雾 (Jade Mist) - 翠绿/青
  {
    primary: '#14b8a6',
    primaryRgb: '20, 184, 166',
    gradient: 'linear-gradient(135deg, #042f2e 0%, #134e4a 50%, #164e63 100%)',
    secondary: '#2dd4bf',
    analogous1: '#2dd4bf',
    glowStrong: 'rgba(20, 184, 166, 0.7)',
  },
];

export interface ThemeColor {
  primary: string;
  primaryRgb: string;
  secondary: string;
  /** @deprecated 使用 secondary 代替 */
  analogous1: string;
  gradient: string;
  glowStrong: string;
  /** 用于 CSS 变量的 HSL 色相值 */
  hue: number;
  /** 情绪类型（可选） */
  mood?: MoodType;
}

/**
 * 增强版哈希函数 - 生成更均匀分布的哈希值
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

/**
 * 基于 HSL 生成颜色
 * @param hue 色相 (0-360)
 * @param saturation 饱和度 (0-100)
 * @param lightness 亮度 (0-100)
 */
function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (hue >= 0 && hue < 60) {
    r = c; g = x; b = 0;
  } else if (hue >= 60 && hue < 120) {
    r = x; g = c; b = 0;
  } else if (hue >= 120 && hue < 180) {
    r = 0; g = c; b = x;
  } else if (hue >= 180 && hue < 240) {
    r = 0; g = x; b = c;
  } else if (hue >= 240 && hue < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 基于种子字符串生成动态主题色
 * @param seed 种子字符串（如 "歌手-歌曲名"）
 */
function generateDynamicColor(seed: string): ThemeColor {
  const hash = hashString(seed);

  // 生成主色相 (0-360)
  const hue = hash % 360;

  // 饱和度范围：60-80%（保持高级感）
  const saturation = 60 + (hash % 20);

  // 亮度范围：50-65%（避免过亮或过暗）
  const lightness = 50 + ((hash >> 8) % 15);

  // 生成主色和辅色
  const primary = hslToHex(hue, saturation, lightness);
  const secondary = hslToHex((hue + 30) % 360, saturation, lightness - 10);

  // 解析 RGB 值
  const r = parseInt(primary.slice(1, 3), 16);
  const g = parseInt(primary.slice(3, 5), 16);
  const b = parseInt(primary.slice(5, 7), 16);
  const primaryRgb = `${r}, ${g}, ${b}`;

  // 生成渐变背景
  const bgHue1 = (hue + 180) % 360; // 互补色
  const bgHue2 = (hue + 210) % 360;
  const gradient = `linear-gradient(135deg, ${hslToHex(bgHue1, 30, 10)} 0%, ${hslToHex(bgHue2, 40, 15)} 50%, ${hslToHex(hue, 50, 20)} 100%)`;

  return {
    primary,
    primaryRgb,
    secondary,
    analogous1: secondary, // 向后兼容
    gradient,
    glowStrong: `rgba(${primaryRgb}, 0.7)`,
    hue,
  };
}

/**
 * 推断歌曲情绪类型
 * 基于歌曲名和歌手名中的关键词
 */
function inferMood(title: string, singer: string): MoodType | null {
  const text = `${title} ${singer}`.toLowerCase();

  // 关键词映射
  const moodKeywords: Record<MoodType, string[]> = {
    passionate: ['摇滚', 'rock', '电子', 'electronic', '热血', '激情', 'fire', 'burn'],
    romantic: ['爱', 'love', '情', 'heart', '浪漫', 'romantic', '恋', 'kiss', '亲爱的'],
    melancholy: ['伤', 'sad', '泪', 'cry', '别', 'goodbye', '离', 'leave', '孤独', 'lonely', '想念'],
    energetic: ['舞', 'dance', '快乐', 'happy', '狂欢', 'party', '活力', 'energy', 'jump'],
    mysterious: ['夜', 'night', '梦', 'dream', '神秘', 'mystery', 'shadow', 'dark'],
    dreamy: ['云', 'cloud', '星', 'star', '天空', 'sky', '梦', 'dream', '幻想'],
    nostalgic: ['老', 'old', '经典', 'classic', '回忆', 'memory', '岁月', 'year', '爵士', 'jazz'],
    pure: ['钢琴', 'piano', '小提琴', 'violin', '纯音乐', 'instrumental', '安静', 'quiet'],
  };

  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      return mood as MoodType;
    }
  }

  return null;
}

/**
 * 主题色生成 Hook
 *
 * @param seed 种子字符串，格式为 "歌手-歌曲名"
 * @param useDynamic 是否使用动态生成模式（默认 false，使用预设调色板）
 * @returns ThemeColor 对象
 *
 * @example
 * // 使用预设调色板
 * const themeColor = useThemeColor('周杰伦-稻香');
 *
 * // 使用动态生成
 * const themeColor = useThemeColor('周杰伦-稻香', true);
 */
export function useThemeColor(seed: string, useDynamic = false): ThemeColor {
  return useMemo(() => {
    if (!seed || seed === 'default') {
      return {
        ...LEGACY_PALETTES[0],
        hue: 187,
      };
    }

    // 解析种子字符串
    const [singer, title] = seed.split('-');

    // 尝试推断情绪
    const mood = inferMood(title || '', singer || '');

    // 如果检测到情绪，使用情绪调色板
    if (mood && !useDynamic) {
      const palette = MOOD_PALETTES[mood];
      return {
        ...palette,
        mood,
      };
    }

    // 使用动态生成模式
    if (useDynamic) {
      return generateDynamicColor(seed);
    }

    // 使用扩展后的预设调色板
    const hash = hashString(seed);
    const index = Math.abs(hash) % LEGACY_PALETTES.length;
    const palette = LEGACY_PALETTES[index];

    // 计算色相值（用于 CSS 变量）
    const hue = (hash % 360);

    return {
      ...palette,
      hue,
    };
  }, [seed, useDynamic]);
}

// 导出调色板供其他组件使用
export { MOOD_PALETTES, LEGACY_PALETTES };
