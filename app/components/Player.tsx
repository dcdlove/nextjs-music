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

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    // 计算圆形进度条的进度
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="relative z-20 flex flex-col items-center justify-center min-h-[60vh] animate-[fadeIn_0.6s_ease-out]">
            {/* 在此渲染 DynamicBackground 以共享 audioDataRef */}
            <DynamicBackground
                isPlaying={isPlaying}
                audioDataRef={audioDataRef}
                vinylPosition={{ x: 50, y: 50 }} // 屏幕中心
                themeColor={themeColor}
            />

            {/* 大唱片播放器容器 */}
            <div className="relative w-[340px] h-[340px] sm:w-[450px] sm:h-[450px] flex items-center justify-center">

                {/* 1. 外层进度环 */}
                <div className="absolute inset-[-20px] sm:inset-[-30px] z-0">
                    <CircularProgress
                        radius={window.innerWidth < 640 ? 190 : 255}
                        stroke={6}
                        progress={progress}
                        color={themeColor.primary}
                        onChange={(val) => handleSeek((val / 100) * duration)}
                    />
                </div>

                {/* 2. 主黑胶唱片主体 */}
                <div
                    className="absolute inset-0 rounded-full shadow-2xl overflow-hidden transition-all duration-700"
                    style={{
                        background: `radial-gradient(circle at 30% 30%, #2a2a2a, #000)`,
                        boxShadow: `0 0 50px ${themeColor.glowStrong}`,
                        transform: isPlaying ? 'scale(1)' : 'scale(0.95)',
                    }}
                >
                    {/* 黑胶纹理 */}
                    <div className="absolute inset-0 opacity-30 bg-[repeating-radial-gradient(#111_0,#111_2px,#222_3px)]" />

                    {/* 旋转部分 (专辑封面 + 可视化器) */}
                    <div
                        className={`absolute inset-[15%] rounded-full transition-transform duration-[20s] linear ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''}`}
                        style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
                    >
                        {/* 圆形可视化器背景 */}
                        <div className="absolute inset-[-10%] opacity-60 mix-blend-screen">
                            <CircularVisualizer
                                analyser={analyserNode}
                                isPlaying={isPlaying}
                                radius={120}
                            />
                        </div>

                        {/* 专辑封面 / 中心标签 */}
                        <div className="absolute inset-[15%] rounded-full overflow-hidden border-4 border-slate-900 shadow-2xl">
                            {/* 专辑封面占位符 - 使用基于主题的渐变 */}
                            <div
                                className="w-full h-full"
                                style={{ background: themeColor.gradient }}
                            />
                            {/* 内部孔洞 */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full border border-white/20" />
                        </div>
                    </div>

                    {/* 3. 集成控制和信息覆盖 */}
                    {/* 控制的玻璃覆盖层 */}
                    <div className="absolute inset-0 flex flex-col items-center justify-between py-12 pointer-events-none">

                        {/* 顶部: 歌曲信息 */}
                        <div className="text-center space-y-1 z-20 pointer-events-auto transition-opacity duration-300 hover:opacity-100 opacity-80">
                            <h2
                                className="text-2xl sm:text-3xl font-black text-white truncate max-w-[200px] sm:max-w-[280px] drop-shadow-md"
                                style={{ color: themeColor.primary }}
                            >
                                {currentTrack ? currentTrack.title : '选择歌曲'}
                            </h2>
                            <p
                                className="text-sm font-bold tracking-widest uppercase"
                                style={{ color: themeColor.analogous1 }}
                            >
                                {currentTrack ? currentTrack.singer : '...'}
                            </p>
                        </div>

                        {/* 底部: 控制 */}
                        <div className="flex items-center gap-8 z-20 pointer-events-auto mb-0">
                            <button
                                onClick={onPrev}
                                className="p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                            >
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                            </button>

                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="w-16 h-16 flex items-center justify-center rounded-full bg-white text-slate-900 shadow-lg hover:scale-110 active:scale-95 transition-all duration-300"
                                style={{
                                    boxShadow: `0 0 30px ${themeColor.primary}`,
                                    color: themeColor.primary
                                }}
                            >
                                {isPlaying ? (
                                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                ) : (
                                    <svg className="w-8 h-8 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                )}
                            </button>

                            <button
                                onClick={onNext}
                                className="p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                            >
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 播放列表切换按钮 (悬浮在下方) */}
            <button
                onClick={onTogglePlaylist}
                className="mt-12 px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 text-sm font-medium tracking-wider"
                style={{ color: themeColor.primary }}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                播放列表
            </button>

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
    );
}
