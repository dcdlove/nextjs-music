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
            {/* 3D Container */}
            <div
                className={`relative w-full h-full transition-transform duration-700 ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}
                style={{
                    transformStyle: 'preserve-3d',
                    transform: isPlaying ? 'rotateY(5deg)' : 'rotateY(0deg)',
                }}
            >
                {/* Vinyl Record - Front Face */}
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
                    {/* Vinyl Grooves */}
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

                    {/* Reflective Shine */}
                    <div
                        className="absolute inset-0 rounded-full opacity-30"
                        style={{
                            background: `linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 40%, transparent 60%, rgba(${themeColor.primaryRgb}, 0.2) 100%)`,
                            transform: 'rotate(45deg)',
                        }}
                    />

                    {/* Center Label */}
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
                        {/* Inner Circle */}
                        <div className="w-3 h-3 rounded-full bg-slate-900 shadow-lg" />

                        {/* Rotating Gradient Overlay */}
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

                {/* Vinyl Edge/Thickness */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: `linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(${themeColor.primaryRgb}, 0.1))`,
                        transform: 'translateZ(-2px)',
                        filter: 'blur(1px)',
                    }}
                />
            </div>

            {/* Glow Effect */}
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
