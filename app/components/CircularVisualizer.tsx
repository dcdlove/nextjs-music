import React, { useEffect, useRef } from 'react';

interface CircularVisualizerProps {
    analyser: AnalyserNode | null;
    isPlaying: boolean;
    radius: number; // The inner radius (album art size / 2)
}

export default function CircularVisualizer({ analyser, isPlaying, radius }: CircularVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !analyser) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to fit the container (with some padding for the bars)
        // We assume the parent container is sized appropriately or we size it here.
        // Let's make the canvas large enough to hold the bars.
        const size = radius * 3.5; // Enough space for bars
        canvas.width = size;
        canvas.height = size;
        const centerX = size / 2;
        const centerY = size / 2;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let animationId: number;

        const renderFrame = () => {
            if (!isPlaying) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            animationId = requestAnimationFrame(renderFrame);

            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // We'll use a subset of the frequency data for better visuals (low to mid-high)
            // and mirror it to make it symmetrical if desired, or just full circle.
            // Let's do full circle.

            const bars = 120; // Number of bars
            const step = Math.floor(bufferLength / bars);
            // Or better: interpolate or just pick indices.

            const angleStep = (Math.PI * 2) / bars;

            for (let i = 0; i < bars; i++) {
                // Get value, maybe average a few bins
                const value = dataArray[i * step];

                // Scale bar length
                const barLength = (value / 255) * (radius * 0.8); // Max length relative to radius

                const angle = i * angleStep - Math.PI / 2; // Start from top

                const x1 = centerX + Math.cos(angle) * radius;
                const y1 = centerY + Math.sin(angle) * radius;
                const x2 = centerX + Math.cos(angle) * (radius + barLength);
                const y2 = centerY + Math.sin(angle) * (radius + barLength);

                // Draw bar
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);

                // Gradient color
                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, 'rgba(34, 211, 238, 0.2)'); // Cyan transparent
                gradient.addColorStop(1, 'rgba(34, 211, 238, 0.8)'); // Cyan solid

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 4; // Bar width
                ctx.lineCap = 'round';
                ctx.stroke();
            }
        };

        renderFrame();

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [analyser, isPlaying, radius]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
            style={{ width: '160%', height: '160%' }} // Scale via CSS to fit if needed, but canvas resolution is set in JS
        />
    );
}
