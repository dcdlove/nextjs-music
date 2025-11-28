import React, { useEffect, useRef, useState } from 'react';
import { Song } from '../types';
import ProgressBar from './ProgressBar';
import DynamicBackground from './DynamicBackground';
import CircularVisualizer from './CircularVisualizer';
import Vinyl3D from './Vinyl3D';
import { useThemeColor } from '../hooks/useThemeColor';

interface PlayerProps {
    currentTrack?: Song;
    audioUrl: string;
    onEnded: () => void;
    onNext: () => void;
    onPrev: () => void;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    onTogglePlaylist: () => void;
    isPlaylistOpen: boolean;
}

export default function Player({
    currentTrack,
    audioUrl,
    onEnded,
    onNext,
    onPrev,
    isPlaying,
    setIsPlaying,
    onTogglePlaylist,
    isPlaylistOpen
}: PlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);

    // Generate theme color based on current track
    const themeColor = useThemeColor(currentTrack ? `${currentTrack.singer}-${currentTrack.title}` : 'default');

    // Audio Analysis Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const audioDataRef = useRef({ intensity: 0, bass: 0, high: 0 });
    const rafIdRef = useRef<number>(0);

    // State for Analyser to pass to child component
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

    // Initialize Audio Context
    useEffect(() => {
        if (!audioRef.current) return;

        const initAudioContext = () => {
            if (!audioContextRef.current && audioRef.current) {
                try {
                    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                    audioContextRef.current = new AudioContext();
                    const analyser = audioContextRef.current.createAnalyser();
                    analyser.fftSize = 512; // Higher resolution for visualizer
                    setAnalyserNode(analyser);

                    // Connect source
                    sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
                    sourceRef.current.connect(analyser);
                    analyser.connect(audioContextRef.current.destination);
                } catch (e) {
                    console.error("AudioContext init failed (likely already connected):", e);
                }
            }

            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
        };

        // Initialize on user interaction (play)
        if (isPlaying) {
            initAudioContext();
        }
    }, [isPlaying]);

    // Analysis Loop (Keep this for DynamicBackground data)
    useEffect(() => {
        if (!isPlaying || !analyserNode) {
            cancelAnimationFrame(rafIdRef.current);
            return;
        }

        const analyze = () => {
            const bufferLength = analyserNode.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserNode.getByteFrequencyData(dataArray);

            // Calculate metrics
            const bassCount = Math.floor(bufferLength * 0.1); // Focus on lower end for bass
            const highStart = Math.floor(bufferLength * 0.7);

            let total = 0;
            let bassTotal = 0;
            let highTotal = 0;

            for (let i = 0; i < bufferLength; i++) {
                const value = dataArray[i];
                total += value;
                if (i < bassCount) bassTotal += value;
                if (i > highStart) highTotal += value;
            }

            audioDataRef.current = {
                intensity: total / bufferLength,
                bass: bassTotal / bassCount,
                high: highTotal / (bufferLength - highStart)
            };

            rafIdRef.current = requestAnimationFrame(analyze);
        };

        analyze();
        return () => cancelAnimationFrame(rafIdRef.current);
    }, [isPlaying, analyserNode]);

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(err => {
                    console.error('Play failed:', err);
                    setIsPlaying(false);
                });
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, audioUrl]);

    // Auto-play when url changes
    useEffect(() => {
        if (audioUrl) {
            setIsPlaying(true);
        }
    }, [audioUrl]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    return (
        <div className="mb-8 relative z-20 animate-[fadeIn_0.6s_ease-out]">
            {/* Render DynamicBackground here to share audioDataRef */}
            <DynamicBackground
                isPlaying={isPlaying}
                audioDataRef={audioDataRef}
                vinylPosition={{ x: 50, y: 25 }} // Approximate center-top position
            />

            {/* Main Card with Dynamic Theme */}
            <div
                className="group relative bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] p-8 sm:p-12 shadow-2xl border transition-all duration-500 gpu-accelerated"
                style={{
                    borderColor: `rgba(${themeColor.primaryRgb}, 0.2)`,
                    boxShadow: isPlaying ? themeColor.glow : '0 0 40px rgba(0,0,0,0.3)',
                }}
            >

                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none rounded-[3rem]" />

                {/* Ambient Background Glow with Theme Color */}
                <div
                    className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none animate-pulse-slow transition-colors duration-1000"
                    style={{ backgroundColor: `rgba(${themeColor.primaryRgb}, 0.3)` }}
                />
                <div
                    className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none animate-pulse-slow delay-1000 transition-colors duration-1000"
                    style={{ backgroundColor: `rgba(${themeColor.primaryRgb}, 0.2)` }}
                />

                <div className="relative z-10 flex flex-col items-center">

                    {/* Album Art / Visualizer Area with 3D Vinyl */}
                    <div className="relative w-56 h-56 sm:w-64 sm:h-64 mb-10 transition-transform duration-700 ease-out">

                        {/* Circular Visualizer */}
                        <CircularVisualizer
                            analyser={analyserNode}
                            isPlaying={isPlaying}
                            radius={140} // Adjust based on container size
                        />

                        {/* Rotating Border with Theme Color */}
                        <div className={`absolute inset-0 rounded-full border transition-all duration-[20s] linear ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''}`}
                            style={{ borderColor: `rgba(${themeColor.primaryRgb}, 0.3)` }}
                        >
                            <div
                                className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full shadow-lg transition-colors duration-1000"
                                style={{
                                    backgroundColor: themeColor.primary,
                                    boxShadow: `0 0 10px ${themeColor.primary}`
                                }}
                            />
                        </div>

                        {/* Outer Glow Ring */}
                        <div className={`absolute inset-2 rounded-full border transition-colors duration-1000 ${isPlaying ? 'animate-pulse' : ''}`}
                            style={{ borderColor: `rgba(${themeColor.primaryRgb}, 0.1)` }}
                        />

                        {/* 3D Vinyl Record */}
                        <div className="absolute inset-4">
                            <Vinyl3D isPlaying={isPlaying} themeColor={themeColor} />
                        </div>
                    </div>

                    {/* Track Info */}
                    <div className="text-center mb-10 w-full max-w-md space-y-2">
                        <h2 className="text-3xl sm:text-4xl font-black text-white truncate tracking-tight drop-shadow-xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                            {currentTrack ? currentTrack.title : 'Select a Song'}
                        </h2>
                        <p
                            className="font-medium text-lg tracking-widest uppercase transition-colors duration-1000"
                            style={{ color: `rgba(${themeColor.primaryRgb}, 0.8)` }}
                        >
                            {currentTrack ? currentTrack.singer : '...'}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full mb-10 px-2">
                        <ProgressBar
                            currentTime={currentTime}
                            duration={duration}
                            onSeek={handleSeek}
                        />
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between w-full max-w-sm gap-8">
                        <button
                            onClick={onPrev}
                            className="group/btn p-4 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-95 backdrop-blur-sm"
                        >
                            <svg className="w-8 h-8 group-hover/btn:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                        </button>

                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="relative w-20 h-20 flex items-center justify-center rounded-full text-slate-900 transition-all duration-300 group/play active:scale-95"
                            style={{
                                background: themeColor.gradient,
                                boxShadow: isPlaying ? themeColor.glowStrong : themeColor.glow,
                                transform: isPlaying ? 'scale(1.1)' : 'scale(1)',
                            }}
                        >
                            <div
                                className="absolute inset-0 rounded-full opacity-20 blur-lg group-hover/play:opacity-40 transition-opacity"
                                style={{ background: themeColor.primary }}
                            />
                            <div className={`transition-transform duration-300 ${isPlaying ? 'scale-100' : 'scale-110'}`}>
                                {isPlaying ? (
                                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                ) : (
                                    <svg className="w-8 h-8 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                )}
                            </div>
                        </button>

                        <button
                            onClick={onNext}
                            className="group/btn p-4 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-95 backdrop-blur-sm"
                        >
                            <svg className="w-8 h-8 group-hover/btn:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                        </button>

                        <button
                            onClick={onTogglePlaylist}
                            className={`p-4 rounded-full transition-all active:scale-95 backdrop-blur-sm ${isPlaylistOpen ? 'text-cyan-400 bg-white/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            title="播放列表"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Volume Slider */}
                    <div className="mt-10 flex items-center gap-4 w-full max-w-[240px] opacity-0 hover:opacity-100 transition-opacity duration-500 bg-black/20 backdrop-blur-md p-3 rounded-2xl border border-white/5">
                        <svg className="w-5 h-5 text-white/60" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        />
                    </div>

                </div>
            </div>

            {/* Hidden Audio Element */}
            <audio
                ref={audioRef}
                src={audioUrl}
                crossOrigin="anonymous"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={onEnded}
                className="hidden"
            />
        </div>
    );
}
