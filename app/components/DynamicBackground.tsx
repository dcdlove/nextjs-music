import React, { useEffect, useState, useRef } from 'react';

interface DynamicBackgroundProps {
  isPlaying: boolean;
  audioDataRef?: React.MutableRefObject<{
    intensity: number; // 0-255
    bass: number; // 0-255
    high: number; // 0-255
  }>;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
}

export default function DynamicBackground({ isPlaying, audioDataRef }: DynamicBackgroundProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const requestRef = useRef<number>(0);
  const lastRippleTime = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) {
      setRipples([]);
      return;
    }

    const animate = (time: number) => {
      let intensity = 0;
      let high = 0;

      if (audioDataRef && audioDataRef.current) {
        intensity = audioDataRef.current.intensity / 255; // Normalize to 0-1
        high = audioDataRef.current.high / 255;
      } else {
        // Fallback simulation if no audio data
        intensity = 0.5;
        high = 0.5;
      }

      // Dynamic threshold: Higher intensity = faster ripples (lower threshold)
      // Base: 600ms, Min: 100ms (very fast)
      const threshold = 600 - (intensity * 500);

      if (time - lastRippleTime.current > threshold + (Math.random() * 200)) {
        const isHighEnergy = high > 0.6;

        const newRipple: Ripple = {
          id: time,
          x: Math.random() * 100,
          y: Math.random() * 100,
          // Size scales with intensity
          size: 100 + (intensity * 400) + (Math.random() * 100),
          // Color shifts based on energy: High energy -> Cyan/White, Low -> Purple/Blue
          color: isHighEnergy
            ? `rgba(34, 211, 238, ${0.3 + intensity * 0.4})` // Bright Cyan
            : `rgba(147, 51, 234, ${0.2 + intensity * 0.2})`, // Purple
          // Animation speed
          speed: isHighEnergy ? 1 : 2, // 1s (fast) or 2s (slow)
        };

        setRipples(prev => [...prev, newRipple]);
        lastRippleTime.current = time;
      }

      // Cleanup
      setRipples(prev => prev.filter(r => time - r.id < (r.speed * 1000)));

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, audioDataRef]);

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-[#0f172a]" />

      {/* Ambient Orbs - React to intensity */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[100px] transition-all duration-200"
        style={{
          transform: isPlaying && audioDataRef ? `scale(${1 + (audioDataRef.current.bass / 255) * 0.5})` : 'scale(1)',
          opacity: isPlaying ? 0.6 : 0.3
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 blur-[120px] transition-all duration-200"
        style={{
          transform: isPlaying && audioDataRef ? `scale(${1 + (audioDataRef.current.intensity / 255) * 0.4})` : 'scale(1)',
          opacity: isPlaying ? 0.5 : 0.2
        }}
      />

      {/* Ripples */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute rounded-full border border-white/20"
          style={{
            left: `${ripple.x}%`,
            top: `${ripple.y}%`,
            width: `${ripple.size}px`,
            height: `${ripple.size}px`,
            borderColor: ripple.color,
            background: `radial-gradient(circle, ${ripple.color} 0%, transparent 70%)`,
            transform: 'translate(-50%, -50%)',
            animation: `ripple-effect ${ripple.speed}s linear forwards`,
          }}
        />
      ))}

      {/* Overlay Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />

      <style jsx>{`
        @keyframes ripple-effect {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
