import React, { useEffect, useRef, useState } from 'react';
import { Song } from '../types';
import CircularProgress from './CircularProgress';
import DynamicBackground from './DynamicBackground';
import CircularVisualizer from './CircularVisualizer';
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

    // 根据当前曲目生成主题色
    const themeColor = useThemeColor(currentTrack ? `${currentTrack.singer}-${currentTrack.title}` : 'default');

    // 音频分析 Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const audioDataRef = useRef({ intensity: 0, bass: 0, high: 0 });
    const rafIdRef = useRef<number>(0);

    // 传递给子组件的分析器状态
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

    // 初始化音频上下文
    useEffect(() => {
        if (!audioRef.current) return;

        const initAudioContext = () => {
            if (!audioContextRef.current && audioRef.current) {
                try {
                    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                    audioContextRef.current = new AudioContext();
                    const analyser = audioContextRef.current.createAnalyser();
                    analyser.fftSize = 512; // 更高的分辨率用于可视化
                    setAnalyserNode(analyser);

                    // 连接源
                    sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
                    sourceRef.current.connect(analyser);
                    analyser.connect(audioContextRef.current.destination);
                } catch (e) {
                    console.error("AudioContext 初始化失败 (可能已连接):", e);
                }
            }

            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
        };

        // 在用户交互（播放）时初始化
        if (isPlaying) {
            initAudioContext();
        }
    }, [isPlaying]);

    // 分析循环（保留此用于 DynamicBackground 数据）
    useEffect(() => {
        if (!isPlaying || !analyserNode) {
            cancelAnimationFrame(rafIdRef.current);
            return;
        }

        const analyze = () => {
            const bufferLength = analyserNode.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserNode.getByteFrequencyData(dataArray);

            // 计算指标
            const bassCount = Math.floor(bufferLength * 0.1); // 专注于低频作为贝斯
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
                    console.error('播放失败:', err);
                    setIsPlaying(false);
                });
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, audioUrl]);

    // 当 url 改变时自动播放
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

    // 计算圆形进度条的进度
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <>
            {/* 在此渲染 DynamicBackground 以共享 audioDataRef */}
            {/* 必须放在 perspective 容器外部，否则 fixed 定位会失效 */}
            <DynamicBackground
                isPlaying={isPlaying}
                audioDataRef={audioDataRef}
                vinylPosition={{ x: 50, y: 45 }} // 稍微向上调整以适应下方信息
                themeColor={themeColor}
            />

            <div className="relative z-20 flex flex-col items-center justify-center min-h-[70vh] w-full perspective-[1000px]">
                {/* 悬浮的唱片容器 */}
                <div
                    className="relative group animate-[pulse-slow_6s_ease-in-out_infinite]"
                    style={{
                        transformStyle: 'preserve-3d',
                        animationPlayState: isPlaying ? 'running' : 'paused'
                    }}
                >
                    {/* 1. 动态光晕背景 (随低音律动) */}
                    <div
                        className="absolute inset-0 rounded-full blur-[60px] transition-all duration-200"
                        style={{
                            background: themeColor.gradient,
                            opacity: isPlaying ? 0.4 : 0.1,
                            transform: isPlaying ? 'scale(1.1)' : 'scale(0.9)',
                        }}
                    />

                    {/* 2. 唱片主体结构 */}
                    <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] flex items-center justify-center">

                        {/* A. 外层进度光环 (激光质感) */}
                        <div className="absolute inset-[-10px] z-10">
                            <CircularProgress
                                radius={window.innerWidth < 640 ? 170 : 220}
                                stroke={4}
                                progress={progress}
                                color={themeColor.primary}
                                onChange={(val) => handleSeek((val / 100) * duration)}
                            />
                        </div>

                        {/* B. 黑胶唱片 (玻璃态 + 纹理) */}
                        <div
                            className="absolute inset-0 rounded-full overflow-hidden shadow-2xl border border-white/10 backdrop-blur-md"
                            style={{
                                background: `radial-gradient(circle at 30% 30%, rgba(20,20,20,0.95), rgba(0,0,0,1))`,
                                boxShadow: `
                                    0 0 0 1px rgba(255,255,255,0.05),
                                    0 20px 50px -10px rgba(0,0,0,0.5),
                                    inset 0 0 60px rgba(0,0,0,0.8)
                                `
                            }}
                        >
                            {/* 纹理层 */}
                            <div
                                className="absolute inset-0 opacity-40 mix-blend-overlay"
                                style={{
                                    background: `repeating-radial-gradient(
                                        #333 0, 
                                        #333 1px, 
                                        transparent 2px, 
                                        transparent 4px
                                    )`
                                }}
                            />

                            {/* 动态流光层 (模拟反光) */}
                            <div
                                className="absolute inset-[-50%] opacity-20 bg-gradient-to-tr from-transparent via-white to-transparent rotate-45 pointer-events-none"
                                style={{
                                    animation: isPlaying ? 'vinyl-shine 8s linear infinite' : 'none'
                                }}
                            />

                            {/* 旋转的核心部分 */}
                            <div
                                className={`absolute inset-[18%] rounded-full transition-transform duration-[20s] linear ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''}`}
                                style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
                            >
                                {/* 可视化器背景 */}
                                <div className="absolute inset-[-15%] opacity-80 mix-blend-screen">
                                    <CircularVisualizer
                                        analyser={analyserNode}
                                        isPlaying={isPlaying}
                                        radius={window.innerWidth < 640 ? 100 : 130}
                                    />
                                </div>

                                {/* 专辑封面 */}
                                <div className="absolute inset-[15%] rounded-full overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8)] border-2 border-white/10">
                                    <div
                                        className="w-full h-full bg-cover bg-center transition-transform duration-700 hover:scale-110"
                                        style={{
                                            background: themeColor.gradient,
                                            // 如果有真实封面图，这里应该是 backgroundImage: `url(${currentTrack.cover})`
                                        }}
                                    />
                                    {/* 中心孔 */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full border border-white/20 shadow-inner" />
                                </div>
                            </div>
                        </div>

                        {/* C. 交互覆盖层 (悬停显示控制) */}
                        <div className="absolute inset-0 flex items-center justify-center z-30 transition-all duration-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:backdrop-blur-[2px]">
                            <div className="flex items-center gap-6 sm:gap-10 transform scale-100 sm:scale-90 sm:group-hover:scale-100 transition-transform duration-300">
                                {/* 上一曲 */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                                    className="p-4 rounded-full text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-md transition-all active:scale-90"
                                >
                                    <svg className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                                </button>

                                {/* 播放/暂停 (巨大图标) */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                                    className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300 hover:scale-110 active:scale-95"
                                >
                                    {isPlaying ? (
                                        <svg className="w-10 h-10 sm:w-12 sm:h-12 fill-current drop-shadow-lg" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                    ) : (
                                        <svg className="w-10 h-10 sm:w-12 sm:h-12 fill-current ml-2 drop-shadow-lg" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    )}
                                </button>

                                {/* 下一曲 */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                                    className="p-4 rounded-full text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-md transition-all active:scale-90"
                                >
                                    <svg className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. 底部信息面板 (分离式设计) */}
                <div className="mt-12 flex flex-col items-center space-y-4 z-20 animate-[fadeIn_0.8s_ease-out_0.2s_both]">
                    <div className="text-center space-y-2">
                        <h2
                            className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 tracking-tight drop-shadow-sm"
                            style={{
                                backgroundImage: themeColor.gradient,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))'
                            }}
                        >
                            {currentTrack ? currentTrack.title : '选择歌曲'}
                        </h2>
                        <p
                            className="text-sm font-bold tracking-[0.2em] uppercase text-white/60"
                        >
                            {currentTrack ? currentTrack.singer : '...'}
                        </p>
                    </div>

                    {/* 播放列表按钮 */}
                    <button
                        onClick={onTogglePlaylist}
                        className="group relative px-6 py-2 rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
                    >
                        <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
                        <div className="absolute inset-0 border border-white/10 rounded-full" />
                        <span
                            className="relative flex items-center gap-2 text-xs font-bold tracking-widest uppercase"
                            style={{ color: themeColor.primary }}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            播放列表
                        </span>
                    </button>
                </div>

                {/* 隐藏的音频元素 */}
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
        </>
    );
}
