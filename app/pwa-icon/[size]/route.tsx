import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const dim = size === '192' ? 192 : 512;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFC244',
        }}
      >
        <div
          style={{
            width: Math.round(dim * 0.76),
            height: Math.round(dim * 0.76),
            borderRadius: '9999px',
            backgroundColor: '#00A082',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: Math.round(dim * 0.44),
            border: `${Math.max(4, Math.round(dim * 0.03))}px solid #FFFFFF`,
          }}
        >
          🍲
        </div>
      </div>
    ),
    { width: dim, height: dim }
  );
}