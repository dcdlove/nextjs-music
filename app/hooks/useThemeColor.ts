import { useMemo } from 'react';

// 基于字符串生成一致的颜色主题
export function useThemeColor(seed: string = '') {
    return useMemo(() => {
        // 使用歌手名和歌曲名生成哈希值
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash;
        }

        // 生成主色调 (HSL)
        const hue = Math.abs(hash % 360);
        const saturation = 60 + (Math.abs(hash) % 20); // 60-80%
        const lightness = 50 + (Math.abs(hash >> 8) % 15); // 50-65%

        // 生成互补色
        const complementHue = (hue + 180) % 360;

        // 生成类似色
        const analogousHue1 = (hue + 30) % 360;
        const analogousHue2 = (hue - 30 + 360) % 360;

        return {
            primary: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
            primaryRgb: hslToRgb(hue, saturation, lightness),
            complement: `hsl(${complementHue}, ${saturation}%, ${lightness}%)`,
            analogous1: `hsl(${analogousHue1}, ${saturation}%, ${lightness}%)`,
            analogous2: `hsl(${analogousHue2}, ${saturation}%, ${lightness}%)`,
            gradient: `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lightness}%) 0%, hsl(${complementHue}, ${saturation - 10}%, ${lightness - 10}%) 100%)`,
            glow: `0 0 40px hsla(${hue}, ${saturation}%, ${lightness}%, 0.4)`,
            glowStrong: `0 0 60px hsla(${hue}, ${saturation}%, ${lightness}%, 0.6)`,
        };
    }, [seed]);
}

function hslToRgb(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    const r = Math.round(255 * f(0));
    const g = Math.round(255 * f(8));
    const b = Math.round(255 * f(4));

    return `${r}, ${g}, ${b}`;
}
