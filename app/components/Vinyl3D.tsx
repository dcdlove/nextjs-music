import React from 'react';

interface Vinyl3DProps {
    isPlaying: boolean;
    themeColor: {
        primary: string;
        primaryRgb: string;
        gradient: string;
    };
}

export default function Vinyl3D({ isPlaying, themeColor }: Vinyl3DProps) {
    return (
        <div className="relative w-full h-full" style={{ perspective: '1000px' }}>
            {/* 3D 容器 */}
            <div
                className={`relative w-full h-full transition-transform duration-700 ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}
                style={{
                    transformStyle: 'preserve-3d',
                    transform: isPlaying ? 'rotateY(5deg)' : 'rotateY(0deg)',
                }}
            >
                {/* 黑胶唱片 - 正面 */}
                <div
                    className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden"
                    style={{
                        background: `radial-gradient(circle at 30% 30%, rgba(${themeColor.primaryRgb}, 0.3), #1a1a1a 40%, #0a0a0a)`,
                        boxShadow: `
              0 0 0 2px rgba(${themeColor.primaryRgb}, 0.2),
              0 10px 40px rgba(0, 0, 0, 0.6),
              inset 0 0 60px rgba(0, 0, 0, 0.8),
              inset 0 0 20px rgba(${themeColor.primaryRgb}, 0.1)
            `,
                        transform: 'translateZ(8px)',
                    }}
                >
                    {/* 黑胶纹理 */}
                    <div className="absolute inset-0 opacity-40">
                        {[...Array(30)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute rounded-full border border-white/5"
                                style={{
                                    top: `${5 + i * 3}%`,
                                    left: `${5 + i * 3}%`,
                                    right: `${5 + i * 3}%`,
                                    bottom: `${5 + i * 3}%`,
                                }}
                            />
                        ))}
                    </div>

                    {/* 反光光泽 */}
                    <div
                        className="absolute inset-0 rounded-full opacity-30"
                        style={{
                            background: `linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 40%, transparent 60%, rgba(${themeColor.primaryRgb}, 0.2) 100%)`,
                            transform: 'rotate(45deg)',
                        }}
                    />

                    {/* 中心标签 */}
                    <div
                        className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-inner"
                        style={{
                            background: themeColor.gradient,
                            boxShadow: `
                0 0 20px rgba(${themeColor.primaryRgb}, 0.5),
                inset 0 2px 10px rgba(0, 0, 0, 0.5)
              `,
                            transform: 'translateZ(4px)',
                        }}
                    >
                        {/* 内圈 */}
                        <div className="w-3 h-3 rounded-full bg-slate-900 shadow-lg" />

                        {/* 旋转渐变覆盖层 */}
                        {isPlaying && (
                            <div
                                className="absolute inset-0 rounded-full opacity-60 animate-spin"
                                style={{
                                    background: `conic-gradient(from 0deg, transparent, rgba(${themeColor.primaryRgb}, 0.6), transparent)`,
                                    animationDuration: '3s',
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* 黑胶边缘/厚度 */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: `linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(${themeColor.primaryRgb}, 0.1))`,
                        transform: 'translateZ(-2px)',
                        filter: 'blur(1px)',
                    }}
                />
            </div>

            {/* 发光效果 */}
            {isPlaying && (
                <div
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{
                        background: `radial-gradient(circle, rgba(${themeColor.primaryRgb}, 0.3) 0%, transparent 70%)`,
                        filter: 'blur(20px)',
                        transform: 'scale(1.2)',
                        pointerEvents: 'none',
                    }}
                />
            )}
        </div>
    );
}
