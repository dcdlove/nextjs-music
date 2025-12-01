import { useMemo } from 'react';

// 预定义的高级感配色调色板
const PALETTES = [
    // 1. 赛博霓虹 (Cyber Neon) - 青/紫
    {
        primary: '#22d3ee', // Cyan-400
        primaryRgb: '34, 211, 238',
        gradient: 'linear-gradient(135deg, #0f172a 0%, #312e81 100%)', // Deep Blue base
        analogous1: '#a855f7', // Purple-500
        glowStrong: 'rgba(34, 211, 238, 0.8)'
    },
    // 2. 黑金奢华 (Midnight Gold) - 金/黑
    {
        primary: '#fbbf24', // Amber-400
        primaryRgb: '251, 191, 36',
        gradient: 'linear-gradient(135deg, #1c1917 0%, #451a03 100%)', // Warm Dark
        analogous1: '#f59e0b', // Amber-500
        glowStrong: 'rgba(251, 191, 36, 0.6)'
    },
    // 3. 极光幻境 (Aurora) - 绿/蓝
    {
        primary: '#34d399', // Emerald-400
        primaryRgb: '52, 211, 153',
        gradient: 'linear-gradient(135deg, #022c22 0%, #115e59 100%)', // Deep Green
        analogous1: '#2dd4bf', // Teal-400
        glowStrong: 'rgba(52, 211, 153, 0.6)'
    },
    // 4. 绯红女巫 (Scarlet Witch) - 红/暗红
    {
        primary: '#f87171', // Red-400
        primaryRgb: '248, 113, 113',
        gradient: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)', // Deep Red
        analogous1: '#ef4444', // Red-500
        glowStrong: 'rgba(248, 113, 113, 0.6)'
    },
    // 5. 深海幽蓝 (Deep Ocean) - 蓝/深蓝
    {
        primary: '#60a5fa', // Blue-400
        primaryRgb: '96, 165, 250',
        gradient: 'linear-gradient(135deg, #172554 0%, #1e3a8a 100%)', // Deep Blue
        analogous1: '#3b82f6', // Blue-500
        glowStrong: 'rgba(96, 165, 250, 0.6)'
    },
    // 6. 梦幻紫罗兰 (Dreamy Violet) - 紫/粉
    {
        primary: '#c084fc', // Purple-400
        primaryRgb: '192, 132, 252',
        gradient: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 100%)', // Deep Purple
        analogous1: '#e879f9', // Fuchsia-400
        glowStrong: 'rgba(192, 132, 252, 0.6)'
    }
];

export interface ThemeColor {
    primary: string;
    primaryRgb: string;
    gradient: string;
    analogous1: string;
    glowStrong: string;
}

export function useThemeColor(seed: string): ThemeColor {
    return useMemo(() => {
        if (!seed) return PALETTES[0];

        // 简单的哈希函数
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }

        // 基于哈希值选择调色板
        const index = Math.abs(hash) % PALETTES.length;
        return PALETTES[index];
    }, [seed]);
}
