import React, { useEffect, useState, useRef } from 'react';

interface DynamicBackgroundProps {
  isPlaying: boolean;
  audioDataRef?: React.MutableRefObject<{
    intensity: number;
    bass: number;
    high: number;
  }>;
  vinylPosition?: { x: number; y: number };
  themeColor?: {
    primary: string;
    primaryRgb: string;
    gradient: string;
    analogous1: string; // 基于提供的代码片段添加此属性
  };
}

interface FlyingNote {
  id: number;
  note: string;
  color: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
}

interface MusicalRipple {
  id: number;
  x: number;
  y: number;
  note: string;
  symbol: string; // 添加符号
  frequency: number;
  intensity: number;
  color: string;
  size: number;
  speed: number;
}

// 简化的半音阶音符及其频率
const MUSICAL_NOTES = [
  { name: 'C', frequency: 261.63, color: 'rgba(255, 99, 71, 0.6)' },      // 红橙色 (暖色)
  { name: 'C#', frequency: 277.18, color: 'rgba(255, 140, 0, 0.6)' },    // 深橙色
  { name: 'D', frequency: 293.66, color: 'rgba(255, 215, 0, 0.6)' },     // 金色
  { name: 'D#', frequency: 311.13, color: 'rgba(173, 255, 47, 0.6)' },   // 黄绿色
  { name: 'E', frequency: 329.63, color: 'rgba(50, 205, 50, 0.6)' },     // 酸橙绿
  { name: 'F', frequency: 349.23, color: 'rgba(0, 255, 255, 0.6)' },     // 青色
  { name: 'F#', frequency: 369.99, color: 'rgba(0, 191, 255, 0.6)' },    // 深天蓝
  { name: 'G', frequency: 392.00, color: 'rgba(65, 105, 225, 0.6)' },    // 皇家蓝
  { name: 'G#', frequency: 415.30, color: 'rgba(138, 43, 226, 0.6)' },   // 蓝紫色
  { name: 'A', frequency: 440.00, color: 'rgba(186, 85, 211, 0.6)' },    // 中兰花紫
  { name: 'A#', frequency: 466.16, color: 'rgba(255, 0, 255, 0.6)' },    // 洋红
  { name: 'B', frequency: 493.88, color: 'rgba(255, 105, 180, 0.6)' },   // 热粉色
];

export default function DynamicBackground({ isPlaying, audioDataRef, vinylPosition, themeColor }: DynamicBackgroundProps) {
  const [ripples, setRipples] = useState<MusicalRipple[]>([]);
  const [flyingNotes, setFlyingNotes] = useState<FlyingNote[]>([]);
  const requestRef = useRef<number>(0);
  const lastRippleTime = useRef<number>(0);

  // 获取符号的辅助函数
  const getSymbol = (noteName: string) => {
    const isSharp = noteName.includes('#');
    const isLowNote = noteName === 'C' || noteName === 'D' || noteName === 'E';
    const isHighNote = noteName === 'A' || noteName === 'B' || noteName === 'G#' || noteName === 'A#';

    if (isSharp) return '♯';
    if (isLowNote) return '♩';
    if (isHighNote) return '♬';
    return '♫';
  };

  // 将频率范围映射到音符
  const getMusicalNote = (intensity: number, bass: number, high: number) => {
    // 确定哪个频率范围占主导地位
    let dominantFreq: number;

    if (bass > high && bass > intensity * 0.7) {
      // 低频 (贝斯) - 低音
      dominantFreq = 100 + (bass / 255) * 200; // 100-300 Hz
    } else if (high > bass && high > intensity * 0.7) {
      // 高频 - 高音
      dominantFreq = 350 + (high / 255) * 200; // 350-550 Hz
    } else {
      // 中频
      dominantFreq = 250 + (intensity / 255) * 200; // 250-450 Hz
    }

    // 寻找最接近的音符
    let closestNote = MUSICAL_NOTES[0];
    let minDiff = Math.abs(dominantFreq - closestNote.frequency);

    for (const note of MUSICAL_NOTES) {
      const diff = Math.abs(dominantFreq - note.frequency);
      if (diff < minDiff) {
        minDiff = diff;
        closestNote = note;
      }
    }

    return closestNote;
  };

  useEffect(() => {
    // 如果暂停，我们不立即清除以允许冻结，
    // 但我们停止生成新的。
    if (!isPlaying) {
      return;
    }

    const animate = (time: number) => {
      let intensity = 0;
      let bass = 0;
      let high = 0;

      if (audioDataRef && audioDataRef.current) {
        intensity = audioDataRef.current.intensity;
        bass = audioDataRef.current.bass;
        high = audioDataRef.current.high;
      } else {
        intensity = 128;
        bass = 100;
        high = 100;
      }

      const normalizedIntensity = intensity / 255;

      // 增加阈值以获得更好的性能（减少音符频率）
      const baseThreshold = 600; // 从 400 增加
      const threshold = baseThreshold - (normalizedIntensity * 400);

      if (time - lastRippleTime.current > threshold) {
        const musicalNote = getMusicalNote(intensity, bass, high);

        // 确定音符特征
        const isLowNote = musicalNote.frequency < 300;
        const isHighNote = musicalNote.frequency > 400;

        // 涟漪的随机目的地
        const endX = 10 + Math.random() * 80;
        const endY = 10 + Math.random() * 80;

        // 如果提供则使用黑胶位置，否则使用中心
        const startX = vinylPosition?.x ?? 50;
        const startY = vinylPosition?.y ?? 30;

        // 基于音符类型的飞行持续时间
        const flightDuration = isHighNote ? 0.6 : isLowNote ? 1.2 : 0.9;

        // 创建飞行音符
        const flyingNote: FlyingNote = {
          id: time,
          note: musicalNote.name,
          color: musicalNote.color,
          startX,
          startY,
          endX,
          endY,
          duration: flightDuration,
        };

        setFlyingNotes(prev => {
          // 限制最大飞行音符数量以保证性能
          const newNotes = [...prev, flyingNote];
          return newNotes.length > 8 ? newNotes.slice(-8) : newNotes;
        });

        // 当音符落地时安排涟漪创建（在动画结束前稍早一点以实现视觉同步）
        setTimeout(() => {
          // 创建符号涟漪
          const symbol = getSymbol(musicalNote.name);
          const newRipple: MusicalRipple = {
            id: time + 1000,
            x: endX,
            y: endY,
            note: musicalNote.name,
            symbol,
            frequency: musicalNote.frequency,
            intensity: normalizedIntensity,
            color: musicalNote.color,
            size: isLowNote ? 200 : isHighNote ? 100 : 150, // 缩放的基础尺寸
            speed: isLowNote ? 3 : isHighNote ? 1.5 : 2,
          };

          setRipples(prev => {
            // 限制最大涟漪数量以保证性能
            const newRipples = [...prev, newRipple];
            return newRipples.length > 6 ? newRipples.slice(-6) : newRipples;
          });
        }, flightDuration * 1000 - 50); // 在音符消失前 50ms 开始涟漪，以实现平滑过渡

        lastRippleTime.current = time;
      }

      // 清理
      setRipples(prev => prev.filter(r => time - r.id < (r.speed * 1000)));
      setFlyingNotes(prev => prev.filter(n => time - n.id < (n.duration * 1000 + 100)));

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, audioDataRef, vinylPosition]);

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
      {/* 基础渐变 - 如果可用则使用主题色 */}
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          background: themeColor
            ? `radial-gradient(circle at 50% 30%, rgba(${themeColor.primaryRgb}, 0.15), #0f172a)`
            : '#0f172a'
        }}
      />

      {/* 环境光球 - 对强度和主题色做出反应 */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] transition-all duration-1000"
        style={{
          backgroundColor: themeColor ? `rgba(${themeColor.primaryRgb}, 0.2)` : 'rgba(147, 51, 234, 0.2)',
          transform: isPlaying && audioDataRef ? `scale(${1 + (audioDataRef.current.bass / 255) * 0.5})` : 'scale(1)',
          opacity: isPlaying ? 0.6 : 0.3
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] transition-all duration-1000"
        style={{
          backgroundColor: themeColor ? themeColor.analogous1 : 'rgba(8, 145, 178, 0.1)',
          transform: isPlaying && audioDataRef ? `scale(${1 + (audioDataRef.current.intensity / 255) * 0.4})` : 'scale(1)',
          opacity: isPlaying ? 0.5 : 0.2
        }}
      />

      {/* 飞行音符 */}
      {flyingNotes.map(note => {
        const symbol = getSymbol(note.note);
        return (
          <div
            key={note.id}
            className="absolute pointer-events-none"
            style={{
              left: `${note.startX}%`,
              top: `${note.startY}%`,
              animation: `fly-to-destination ${note.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
              animationPlayState: isPlaying ? 'running' : 'paused', // 暂停动画
              willChange: 'transform, opacity',
              transform: 'translateZ(0)',
              '--end-x': `${note.endX - note.startX}vw`,
              '--end-y': `${note.endY - note.startY}vh`,
            } as React.CSSProperties}
          >
            {/* 外发光 */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full blur-xl animate-pulse"
              style={{
                background: `radial-gradient(circle, ${note.color}, transparent)`,
                opacity: 0.6,
                animationPlayState: isPlaying ? 'running' : 'paused',
              }}
            />
            {/* 音符符号 */}
            <div
              className="relative text-5xl font-black z-10"
              style={{
                color: note.color,
                textShadow: `0 0 20px ${note.color}`,
                filter: 'drop-shadow(0 0 8px currentColor)',
                WebkitTextStroke: `1px rgba(255,255,255,0.3)`,
              }}
            >
              {symbol}
            </div>
          </div>
        );
      })}

      {/* 音乐涟漪 - 多层波浪传播 */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute pointer-events-none"
          style={{
            left: `${ripple.x}%`,
            top: `${ripple.y}%`,
            transform: 'translate(-50%, -50%)',
            width: `${ripple.size}px`,
            height: `${ripple.size}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* 生成 3 个波浪层 */}
          {[0, 1, 2].map((i) => {
            const maxScale = 10 - i * 5;
            return (
              <div
                key={i}
                className="absolute font-black"
                style={{
                  color: ripple.color,
                  fontSize: '1em',
                  opacity: 0,
                  '--max-scale': maxScale,
                  animation: `symbol-ripple-dynamic 0.32s ease-out forwards`,
                  animationDelay: `${i * 0.08}s`, // 40ms 间隔
                  animationPlayState: isPlaying ? 'running' : 'paused',
                  willChange: 'transform, opacity',
                  transformOrigin: 'center center',
                } as React.CSSProperties}
              >
                {ripple.symbol}
              </div>
            );
          })}
        </div>
      ))}

      {/* Overlay Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />

      <style jsx>{`
        @keyframes fly-to-destination {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(calc(var(--end-x) * 0.5), calc(var(--end-y) * 0.5 - 50px)) scale(1.3);
            opacity: 0.9;
          }
          100% {
            transform: translate(var(--end-x), var(--end-y)) scale(0.8);
            opacity: 0;
          }
        }
        
        @keyframes symbol-ripple-dynamic {
          0% { transform: scale(1); opacity: 0.8; }
          50% { opacity: 0.5; }
          100% { transform: scale(var(--max-scale)); opacity: 0; }
        }

        @keyframes bubble-float {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -55%) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
