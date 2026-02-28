import React, { memo, useState, useCallback } from 'react';
import { Song } from '../types';

interface SongItemProps {
    item: Song;
    index: number;
    isPlaying: boolean;
    isLiked: boolean;
    onPlay: (url: string) => void;
    onLike: (url: string) => void;
}

const SongItem = memo(({ item, index, isPlaying, isLiked, onPlay, onLike }: SongItemProps) => {
    const decodedUrl = decodeURIComponent(item.url);
    const [isHeartBeating, setIsHeartBeating] = useState(false);

    // 收藏按钮点击 - 触发心跳动画
    const handleLike = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isLiked) {
            // 新收藏时触发心跳动画
            setIsHeartBeating(true);
            setTimeout(() => setIsHeartBeating(false), 800);
        }
        onLike(item.url);
    }, [isLiked, onLike, item.url]);

    return (
        <li
            className={`group relative flex items-center justify-between gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300 border border-transparent ${isPlaying
                ? 'bg-white/10 border-white/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                : 'hover:bg-white/5 hover:border-white/5 hover:-translate-y-0.5 hover:shadow-lg'
                } ${item.null ? 'opacity-40 pointer-events-none grayscale' : ''}`}
            onClick={() => onPlay(decodedUrl)}
            style={{
                animation: `fadeInUp 0.3s ease-out ${index * 0.02}s both`
            }}
        >
            {/* 播放指示条 */}
            {isPlaying && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse" />
            )}

            <div className="flex-1 flex items-center gap-4 overflow-hidden pl-2">
                <span className={`font-mono w-6 text-center text-xs transition-colors ${isPlaying ? 'text-cyan-400' : 'text-white/20 group-hover:text-white/40'}`}>
                    {String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex flex-col overflow-hidden">
                    <span className={`font-body truncate text-sm font-medium transition-colors ${isPlaying ? 'text-cyan-300' : 'text-white/80 group-hover:text-white'}`}>
                        {item.title}
                    </span>
                    <span className="font-body truncate text-xs text-white/40 group-hover:text-white/60 transition-colors">
                        {item.singer}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {isPlaying && (
                    <div className="flex gap-[2px] items-end h-3">
                        <div className="w-0.5 bg-cyan-400 animate-[bounce_0.6s_infinite]" style={{ height: '40%' }} />
                        <div className="w-0.5 bg-cyan-400 animate-[bounce_0.8s_infinite_0.1s]" style={{ height: '70%' }} />
                        <div className="w-0.5 bg-cyan-400 animate-[bounce_0.5s_infinite_0.2s]" style={{ height: '100%' }} />
                    </div>
                )}

                {/* 收藏按钮 - 心跳动画增强 */}
                <button
                    onClick={handleLike}
                    className={`p-2 rounded-full transition-all active:scale-90 hover:bg-white/10 ${isLiked ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]' : 'text-white/20 hover:text-white/60'
                        } ${isHeartBeating ? 'animate-heart-beat' : ''}`}
                    title={isLiked ? '取消喜欢' : '标记为喜欢'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </button>
            </div>

            <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </li>
    );
});

SongItem.displayName = 'SongItem';

interface SongListProps {
    songs: Song[];
    currentUrl: string;
    onPlay: (url: string) => void;
    onLike: (url: string) => void;
    likedSongs: Set<string>;
}

export default function SongList({ songs, currentUrl, onPlay, onLike, likedSongs }: SongListProps) {
    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex justify-between items-center px-2 py-4 text-white/40 text-xs font-medium tracking-widest uppercase border-b border-white/5">
                <span className="font-display text-sm tracking-[0.2em]">Track List</span>
                <span className="font-mono">{songs.length} Songs</span>
            </div>
            <ul className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20 pr-2 space-y-1 mt-2">
                {songs.map((item, index) => {
                    const decodedUrl = decodeURIComponent(item.url);
                    const isPlaying = decodedUrl === currentUrl;
                    const isLiked = likedSongs.has(decodedUrl);

                    return (
                        <SongItem
                            key={decodedUrl}
                            item={item}
                            index={index}
                            isPlaying={isPlaying}
                            isLiked={isLiked}
                            onPlay={onPlay}
                            onLike={onLike}
                        />
                    );
                })}
            </ul>
        </div>
    );
}
