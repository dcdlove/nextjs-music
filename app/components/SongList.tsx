import React from 'react';
import { Song } from '../types';

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
                <span>Track List</span>
                <span>{songs.length} Songs</span>
            </div>
            <ul className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20 pr-2 space-y-1 mt-2">
                {songs.map((item, index) => {
                    const decodedUrl = decodeURIComponent(item.url);
                    const isPlaying = decodedUrl === currentUrl;
                    const isLiked = likedSongs.has(decodedUrl);

                    return (
                        <li
                            key={decodedUrl}
                            className={`group relative flex items-center justify-between gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300 border border-transparent ${isPlaying
                                    ? 'bg-white/10 border-white/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                                    : 'hover:bg-white/5 hover:border-white/5'
                                } ${item.null ? 'opacity-40 pointer-events-none grayscale' : ''}`}
                            onClick={() => onPlay(decodedUrl)}
                        >
                            {/* Playing Indicator Bar */}
                            {isPlaying && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                            )}

                            <div className="flex-1 flex items-center gap-4 overflow-hidden pl-2">
                                <span className={`w-6 text-center text-xs font-mono ${isPlaying ? 'text-cyan-400' : 'text-white/20 group-hover:text-white/40'}`}>
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <div className="flex flex-col overflow-hidden">
                                    <span className={`truncate text-sm font-medium transition-colors ${isPlaying ? 'text-cyan-300' : 'text-white/80 group-hover:text-white'}`}>
                                        {item.title}
                                    </span>
                                    <span className="truncate text-xs text-white/40 group-hover:text-white/60 transition-colors">
                                        {item.singer}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {isPlaying && (
                                    <div className="flex gap-[2px] items-end h-3">
                                        <div className="w-0.5 bg-cyan-400 animate-[bounce_0.6s_infinite]" />
                                        <div className="w-0.5 bg-cyan-400 animate-[bounce_0.8s_infinite_0.1s]" />
                                        <div className="w-0.5 bg-cyan-400 animate-[bounce_0.5s_infinite_0.2s]" />
                                    </div>
                                )}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onLike(item.url);
                                    }}
                                    className={`p-2 rounded-full transition-all active:scale-90 hover:bg-white/10 ${isLiked ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]' : 'text-white/20 hover:text-white/60'
                                        }`}
                                    title={isLiked ? '取消喜欢' : '标记为喜欢'}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
