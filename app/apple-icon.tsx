import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Image generation
export default function AppleIcon() {
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
          borderRadius: '40px',
        }}
      >
        {/* 黑胶唱片 */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
            border: '2px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(34, 211, 238, 0.3)',
          }}
        >
          {/* 唱片纹路 */}
          <div
            style={{
              position: 'absolute',
              width: 100,
              height: 100,
              borderRadius: '50%',
              border: '0.5px solid rgba(255,255,255,0.05)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: '0.5px solid rgba(255,255,255,0.05)',
            }}
          />

          {/* 中心圆 */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#0a0a0f',
              border: '3px solid #22d3ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
            }}
          >
            {/* 播放符号 */}
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '12px solid #22d3ee',
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                marginLeft: '3px',
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
