import React from 'react';

interface CircularProgressProps {
    radius: number;
    stroke: number;
    progress: number; // 0 to 100
    color: string;
    onChange?: (value: number) => void;
}

export default function CircularProgress({ radius, stroke, progress, color, onChange }: CircularProgressProps) {
    // 使用 stroke/2 确保描边完全在容器内，不会被裁剪
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!onChange) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - radius;
        const y = e.clientY - rect.top - radius;

        // 计算弧度角度
        let angle = Math.atan2(y, x);
        // 调整角度从顶部开始 (-PI/2) 并顺时针方向
        angle = angle + Math.PI / 2;
        if (angle < 0) angle += 2 * Math.PI;

        const newProgress = (angle / (2 * Math.PI)) * 100;
        onChange(newProgress);
    };

    return (
        <div className="relative flex items-center justify-center">
            <svg
                height={radius * 2}
                width={radius * 2}
                className="rotate-[-90deg] cursor-pointer"
                onClick={handleClick}
                style={{ overflow: 'visible' }} // 允许发光效果溢出
            >
                {/* 轨道 */}
                <circle
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth={stroke}
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                {/* 进度 */}
                <circle
                    stroke={color}
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{
                        strokeDashoffset,
                        transition: 'stroke-dashoffset 0.1s linear',
                        filter: `drop-shadow(0 0 8px ${color})`
                    }}
                    strokeLinecap="round"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            {/* 滑块/旋钮 */}
            <div
                className="absolute pointer-events-none"
                style={{
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    transform: `rotate(${progress * 3.6}deg)`,
                    transition: 'transform 0.1s linear'
                }}
            >
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                    style={{
                        backgroundColor: '#fff',
                        boxShadow: `0 0 15px 2px ${color}, 0 0 5px #fff`,
                        marginTop: stroke / 2 // 精确对齐描边中心
                    }}
                />
            </div>
        </div>
    );
}
