import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'Serendipity - 不期而遇的惊喜';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Image generation
export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 背景装饰 - 环境光球 */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-10%',
            width: '40%',
            height: '40%',
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.3)',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-10%',
            width: '50%',
            height: '50%',
            borderRadius: '50%',
            background: 'rgba(34, 211, 238, 0.2)',
            filter: 'blur(100px)',
          }}
        />

        {/* 星尘纹理 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        {/* 主内容 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
          }}
        >
          {/* Logo - 黑胶唱片 */}
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
              border: '3px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 60px rgba(34, 211, 238, 0.4), 0 0 120px rgba(139, 92, 246, 0.2)',
            }}
          >
            {/* 中心圆 */}
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                backgroundColor: '#0a0a0f',
                border: '4px solid #22d3ee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(34, 211, 238, 0.6)',
              }}
            >
              {/* 播放符号 */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '16px solid #22d3ee',
                  borderTop: '10px solid transparent',
                  borderBottom: '10px solid transparent',
                  marginLeft: '4px',
                }}
              />
            </div>
          </div>

          {/* 品牌名 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <h1
              style={{
                fontSize: 72,
                fontWeight: 400,
                fontFamily: 'Georgia, serif',
                background: 'linear-gradient(135deg, #ffffff 0%, #cffafe 50%, #bfdbfe 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                margin: 0,
                letterSpacing: '-2px',
              }}
            >
              Serendipity
            </h1>
            <p
              style={{
                fontSize: 20,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '8px',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              不期而遇的惊喜
            </p>
          </div>

          {/* 描述 */}
          <p
            style={{
              fontSize: 18,
              color: 'rgba(255,255,255,0.4)',
              maxWidth: 400,
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            一款融合黑胶复古与赛博未来美学的在线音乐播放器
          </p>
        </div>

        {/* 底部装饰线 */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 60,
              height: 1,
              background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.3))',
            }}
          />
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22d3ee',
              boxShadow: '0 0 10px rgba(34, 211, 238, 0.8)',
            }}
          />
          <div
            style={{
              width: 60,
              height: 1,
              background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.3))',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
