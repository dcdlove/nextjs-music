import React, { useEffect, useState, useRef } from 'react';

interface DynamicBackgroundProps {
  isPlaying: boolean;
  audioDataRef?: React.MutableRefObject<{
    intensity: number;
    bass: number;
    high: number;
  }>;
  vinylPosition?: { x: number; y: number }; // Position of the vinyl in viewport
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
  note: string; // Musical note name
  frequency: number; // Frequency in Hz
  intensity: number; // 0-1
  color: string;
  size: number;
  speed: number;
  rings: number; // Number of concentric rings
}

// Musical notes with their frequencies (simplified chromatic scale)
const MUSICAL_NOTES = [
  { name: 'C', frequency: 261.63, color: 'rgba(255, 99, 71, 0.6)' },      // Red-Orange (Warm)
  { name: 'C#', frequency: 277.18, color: 'rgba(255, 140, 0, 0.6)' },    // Dark Orange
  { name: 'D', frequency: 293.66, color: 'rgba(255, 215, 0, 0.6)' },     // Gold
  { name: 'D#', frequency: 311.13, color: 'rgba(173, 255, 47, 0.6)' },   // Green-Yellow
  { name: 'E', frequency: 329.63, color: 'rgba(50, 205, 50, 0.6)' },     // Lime Green
  { name: 'F', frequency: 349.23, color: 'rgba(0, 255, 255, 0.6)' },     // Cyan
  { name: 'F#', frequency: 369.99, color: 'rgba(0, 191, 255, 0.6)' },    // Deep Sky Blue
  { name: 'G', frequency: 392.00, color: 'rgba(65, 105, 225, 0.6)' },    // Royal Blue
  { name: 'G#', frequency: 415.30, color: 'rgba(138, 43, 226, 0.6)' },   // Blue Violet
  { name: 'A', frequency: 440.00, color: 'rgba(186, 85, 211, 0.6)' },    // Medium Orchid
  { name: 'A#', frequency: 466.16, color: 'rgba(255, 0, 255, 0.6)' },    // Magenta
  { name: 'B', frequency: 493.88, color: 'rgba(255, 105, 180, 0.6)' },   // Hot Pink
];

export default function DynamicBackground({ isPlaying, audioDataRef, vinylPosition }: DynamicBackgroundProps) {
  const [ripples, setRipples] = useState<MusicalRipple[]>([]);
  const [flyingNotes, setFlyingNotes] = useState<FlyingNote[]>([]);
  const requestRef = useRef<number>(0);
  const lastRippleTime = useRef<number>(0);

  // Map frequency range to musical note
  const getMusicalNote = (intensity: number, bass: number, high: number) => {
    // Determine which frequency range is dominant
    let dominantFreq: number;

    if (bass > high && bass > intensity * 0.7) {
      // Low frequencies (bass) - lower notes
      dominantFreq = 100 + (bass / 255) * 200; // 100-300 Hz
    } else if (high > bass && high > intensity * 0.7) {
      // High frequencies - higher notes
      dominantFreq = 350 + (high / 255) * 200; // 350-550 Hz
    } else {
      // Mid frequencies
      dominantFreq = 250 + (intensity / 255) * 200; // 250-450 Hz
    }

    // Find closest musical note
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
    if (!isPlaying) {
      setRipples([]);
      setFlyingNotes([]);
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

      // Increased threshold for better performance (less frequent notes)
      const baseThreshold = 600; // Increased from 400
      const threshold = baseThreshold - (normalizedIntensity * 400);

      if (time - lastRippleTime.current > threshold) {
        const musicalNote = getMusicalNote(intensity, bass, high);

        // Determine note characteristics
        const isLowNote = musicalNote.frequency < 300;
        const isHighNote = musicalNote.frequency > 400;

        // Random destination for ripple
        const endX = 10 + Math.random() * 80;
        const endY = 10 + Math.random() * 80;

        // Use vinyl position if provided, otherwise use center
        const startX = vinylPosition?.x ?? 50;
        const startY = vinylPosition?.y ?? 30;

        // Flight duration based on note type
        const flightDuration = isHighNote ? 0.6 : isLowNote ? 1.2 : 0.9;

        // Create flying note
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
          // Limit max flying notes for performance
          const newNotes = [...prev, flyingNote];
          return newNotes.length > 8 ? newNotes.slice(-8) : newNotes;
        });

        // Schedule ripple creation when note lands (slightly before animation ends for visual sync)
        setTimeout(() => {
          const newRipple: MusicalRipple = {
            id: time + 1000,
            x: endX,
            y: endY,
            note: musicalNote.name,
            frequency: musicalNote.frequency,
            intensity: normalizedIntensity,
            color: musicalNote.color,
            size: isLowNote
              ? 150 + (normalizedIntensity * 300)
              : isHighNote
                ? 80 + (normalizedIntensity * 150)
                : 120 + (normalizedIntensity * 200),
            speed: isLowNote
              ? 2.5 + (normalizedIntensity * 0.5)
              : isHighNote
                ? 1.2 + (normalizedIntensity * 0.3)
                : 1.8 + (normalizedIntensity * 0.4),
            rings: isLowNote ? 3 : isHighNote ? 4 : 3, // Reduced rings
          };

          setRipples(prev => {
            // Limit max ripples for performance
            const newRipples = [...prev, newRipple];
            return newRipples.length > 6 ? newRipples.slice(-6) : newRipples;
          });
        }, flightDuration * 1000 - 50); // Start ripple 50ms before note disappears for smooth transition

        lastRippleTime.current = time;
      }

      // Cleanup
      setRipples(prev => prev.filter(r => time - r.id < (r.speed * 1000)));
      setFlyingNotes(prev => prev.filter(n => time - n.id < (n.duration * 1000 + 100)));

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, audioDataRef, vinylPosition]);

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

      {/* Flying Notes */}
      {flyingNotes.map(note => {
        // Choose musical symbol based on note characteristics
        const isSharp = note.note.includes('#');
        const isLowNote = note.note === 'C' || note.note === 'D' || note.note === 'E';
        const isHighNote = note.note === 'A' || note.note === 'B' || note.note === 'G#' || note.note === 'A#';

        let symbol = '♪';
        if (isSharp) {
          symbol = '♯';
        } else if (isLowNote) {
          symbol = '♩';
        } else if (isHighNote) {
          symbol = '♬';
        } else {
          symbol = '♫';
        }

        return (
          <div
            key={note.id}
            className="absolute pointer-events-none"
            style={{
              left: `${note.startX}%`,
              top: `${note.startY}%`,
              animation: `fly-to-destination ${note.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
              willChange: 'transform, opacity',
              transform: 'translateZ(0)',
              '--end-x': `${note.endX - note.startX}vw`,
              '--end-y': `${note.endY - note.startY}vh`,
            } as React.CSSProperties}
          >
            {/* Outer glow */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full blur-xl animate-pulse"
              style={{
                background: `radial-gradient(circle, ${note.color}, transparent)`,
                opacity: 0.6,
              }}
            />
            {/* Note symbol */}
            <div
              className="relative text-5xl font-black"
              style={{
                color: note.color,
                textShadow: `
                  0 0 10px ${note.color},
                  0 0 20px ${note.color},
                  0 0 30px ${note.color},
                  0 0 40px ${note.color},
                  0 2px 4px rgba(0,0,0,0.5)
                `,
                filter: 'drop-shadow(0 0 8px currentColor)',
                WebkitTextStroke: `1px rgba(255,255,255,0.3)`,
              }}
            >
              {symbol}
            </div>
          </div>
        );
      })}

      {/* Musical Ripples */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute"
          style={{
            left: `${ripple.x}%`,
            top: `${ripple.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Multiple concentric rings for water ripple effect */}
          {[...Array(ripple.rings)].map((_, index) => (
            <div
              key={index}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{
                width: `${ripple.size}px`,
                height: `${ripple.size}px`,
                borderColor: ripple.color,
                background: `radial-gradient(circle, ${ripple.color} 0%, transparent 70%)`,
                animation: `musical-ripple ${ripple.speed}s ease-out forwards`,
                animationDelay: `${index * 0.15}s`,
                opacity: 0.8 - (index * 0.15),
                willChange: 'transform, opacity',
                transform: 'translateZ(0)',
              }}
            />
          ))}
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
        
        @keyframes musical-ripple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.8;
            border-width: 3px;
          }
          50% {
            border-width: 2px;
          }
          100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
            border-width: 1px;
          }
        }
        
        @keyframes note-fade {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}
