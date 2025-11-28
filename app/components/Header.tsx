import React from 'react';

export default function Header() {
    return (
        <header className="text-center mb-10 pt-10 relative z-10">
            <div className="inline-block relative group cursor-default">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg blur opacity-20 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <h1 className="relative text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-100 to-blue-200 mb-2 drop-shadow-2xl tracking-tighter transform transition-transform duration-500 group-hover:scale-105">
                    Serendipity
                </h1>
            </div>
            <div className="flex items-center justify-center gap-3 mt-2">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-white/30"></div>
                <p className="text-cyan-100/60 text-xs md:text-sm font-light tracking-[0.3em] uppercase backdrop-blur-sm">
                    不期而遇的惊喜
                </p>
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white/30"></div>
            </div>
        </header>
    );
}
