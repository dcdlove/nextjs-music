import React from 'react';

export default function Header() {
    return (
        <header className="text-center mb-10 pt-8 relative z-10 animate-enter-bottom delay-200">
            {/* 品牌名 */}
            <div className="inline-block relative group cursor-default">
                {/* 多层光晕效果 */}
                <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 rounded-2xl blur-2xl opacity-40 group-hover:opacity-70 transition-all duration-700"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/30 to-purple-600/30 rounded-xl blur-xl opacity-30 group-hover:opacity-60 transition-all duration-500"></div>

                {/* 主标题 - Playfair Display Black 900 */}
                <h1
                    className="relative text-5xl md:text-7xl lg:text-8xl mb-2 drop-shadow-2xl tracking-wide transform transition-all duration-500 group-hover:scale-105 group-hover:tracking-wider"
                    style={{
                        fontFamily: 'var(--font-display), Georgia, serif',
                        fontWeight: 900,
                        fontStyle: 'italic',
                        background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 25%, #c4b5fd 50%, #a78bfa 75%, #f0abfc 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        textShadow: '0 0 60px rgba(167, 139, 250, 0.5)',
                        letterSpacing: '0.02em',
                    }}
                >
                    Serendipity
                </h1>

                {/* 底部装饰线 */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-violet-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

            {/* 副标题 */}
            <div className="flex items-center justify-center gap-3 mt-4">
                <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-white/40"></div>
                <p
                    className="text-violet-200/70 text-xs md:text-sm font-light tracking-[0.4em] uppercase backdrop-blur-sm"
                    style={{ fontFamily: 'var(--font-body), sans-serif' }}
                >
                    不期而遇的惊喜
                </p>
                <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-white/40"></div>
            </div>
        </header>
    );
}
