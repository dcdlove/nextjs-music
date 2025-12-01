import React, { useRef, useEffect } from 'react';

interface ProgressBarProps {
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
}

export default function ProgressBar({ currentTime, duration, onSeek }: ProgressBarProps) {
    const progressRef = useRef<HTMLDivElement>(null);

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressRef.current || !duration) return;
        const rect = progressRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        onSeek(percent * duration);
    };

    const percent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className="w-full space-y-2 group">
            <div
                ref={progressRef}
                className="h-2 bg-white/10 rounded-full cursor-pointer relative overflow-hidden"
                onClick={handleClick}
            >
                {/* 背景轨道 */}
                <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />

                {/* 进度填充 */}
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-100 ease-linear relative"
                    style={{ width: `${percent}%` }}
                >
                    {/* 发光效果 */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity transform scale-150" />
                </div>
            </div>

            <div className="flex justify-between text-xs text-white/40 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    );
}
