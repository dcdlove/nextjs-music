import React from 'react';
import { SortMode } from '../types';

interface ControlsProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    sortMode: SortMode;
    setSortMode: (mode: SortMode) => void;
}

export default function Controls({ searchTerm, setSearchTerm, sortMode, setSortMode }: ControlsProps) {
    return (
        <div className="flex flex-col gap-5 mb-2">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-white/40 group-focus-within:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="font-body w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:bg-white/10 transition-all backdrop-blur-md text-sm font-medium tracking-wide"
                />
            </div>

            <div className="flex items-center justify-between bg-black/20 p-1.5 rounded-2xl backdrop-blur-md border border-white/5">
                {(['default', 'random', 'liked'] as SortMode[]).map(mode => (
                    <button
                        key={mode}
                        onClick={() => setSortMode(mode)}
                        className={`font-body flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${sortMode === mode
                                ? 'bg-white/10 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.1)] border border-white/10'
                                : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        {mode === 'default' && 'Default'}
                        {mode === 'random' && 'Shuffle'}
                        {mode === 'liked' && 'Liked'}
                    </button>
                ))}
            </div>
        </div>
    );
}
