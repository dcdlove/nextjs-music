import React, { useEffect, useRef, useState } from 'react';

type VisualizerMode = 'bars' | 'wave' | 'particles' | 'arcs';

interface CircularVisualizerProps {
    analyser: AnalyserNode | null;
    isPlaying: boolean;
    radius: number;
}

export default function CircularVisualizer({ analyser, isPlaying, radius }: CircularVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mode, setMode] = useState<VisualizerMode>('bars');

    const toggleMode = () => {
        setMode(prev => {
            if (prev === 'bars') return 'wave';
            if (prev === 'wave') return 'particles';
            if (prev === 'particles') return 'arcs';
            return 'bars';
        });
    };

    useEffect(() => {
        if (!canvasRef.current || !analyser) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 设置画布大小（高分辨率）
        const scale = 2;
        const size = radius * 2 * 1.6; // 容器的 160%
        canvas.width = size * scale;
        canvas.height = size * scale;
        ctx.scale(scale, scale);

        let animationId: number;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // 'particles' 模式的粒子系统
        let particles: { x: number, y: number, speed: number, angle: number, size: number, color: string }[] = [];

        const draw = () => {
            animationId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, size, size);
            const centerX = size / 2;
            const centerY = size / 2;

            if (!isPlaying) return;

            if (mode === 'bars') {
                const bars = 120;
                const step = Math.floor(bufferLength / bars);
                const barWidth = (2 * Math.PI * radius) / bars;

                for (let i = 0; i < bars; i++) {
                    const value = dataArray[i * step];
                    const percent = value / 255;
                    const height = percent * (radius * 0.6);
                    const angle = (i / bars) * 2 * Math.PI - Math.PI / 2;

                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius;
                    const endX = centerX + Math.cos(angle) * (radius + height);
                    const endY = centerY + Math.sin(angle) * (radius + height);

                    const gradient = ctx.createLinearGradient(x, y, endX, endY);
                    gradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
                    gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.5)');
                    gradient.addColorStop(1, 'rgba(34, 211, 238, 0.8)');

                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(endX, endY);
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = barWidth * 0.8;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                }
            } else if (mode === 'wave') {
                ctx.beginPath();
                const points = 180;
                const step = Math.floor(bufferLength / points);

                for (let i = 0; i <= points; i++) {
                    const value = dataArray[(i % points) * step];
                    const percent = value / 255;
                    const r = radius + (percent * 40);
                    const angle = (i / points) * 2 * Math.PI - Math.PI / 2;

                    const x = centerX + Math.cos(angle) * r;
                    const y = centerY + Math.sin(angle) * r;

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = 'rgba(34, 211, 238, 0.1)';
                ctx.fill();
            } else if (mode === 'particles') {
                // 基于低音发射新粒子
                const bass = dataArray[10]; // 低频
                if (bass > 200 && Math.random() > 0.5) {
                    const angle = Math.random() * Math.PI * 2;
                    particles.push({
                        x: centerX + Math.cos(angle) * radius,
                        y: centerY + Math.sin(angle) * radius,
                        speed: 1 + Math.random() * 2,
                        angle: angle,
                        size: 1 + Math.random() * 3,
                        color: `rgba(34, 211, 238, ${0.5 + Math.random() * 0.5})`
                    });
                }

                // 更新并绘制粒子
                particles.forEach((p, index) => {
                    p.x += Math.cos(p.angle) * p.speed;
                    p.y += Math.sin(p.angle) * p.speed;
                    p.size *= 0.96; // 收缩

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();

                    if (p.size < 0.2) particles.splice(index, 1);
                });
            } else if (mode === 'arcs') {
                const bands = 4;
                for (let b = 0; b < bands; b++) {
                    const startBin = b * 20;
                    let sum = 0;
                    for (let k = 0; k < 20; k++) sum += dataArray[startBin + k];
                    const avg = sum / 20;
                    const percent = avg / 255;

                    const r = radius + (b * 15);
                    const startAngle = Date.now() / (1000 - b * 100);
                    const endAngle = startAngle + (percent * Math.PI * 1.5);

                    ctx.beginPath();
                    ctx.arc(centerX, centerY, r, startAngle, endAngle);
                    ctx.strokeStyle = `rgba(34, 211, 238, ${0.3 + b * 0.15})`;
                    ctx.lineWidth = 4;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                }
            }
        };

        draw();

        return () => cancelAnimationFrame(animationId);
    }, [analyser, isPlaying, radius, mode]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full cursor-pointer transition-opacity duration-300 hover:opacity-100"
            style={{ width: '100%', height: '100%' }}
            onClick={toggleMode}
            title="点击切换可视化模式"
        />
    );
}
