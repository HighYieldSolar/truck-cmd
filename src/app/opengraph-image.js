import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Truck Command - Trucking Business Management Software';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  // Fetch the logo from the public folder
  const logoUrl = new URL('/images/TC_pfp.png', 'https://truckcommand.com');

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #007BFF 0%, #0056b3 50%, #003d80 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        {/* Logo container with actual logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '20px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl.toString()}
            alt="Truck Command Logo"
            width={150}
            height={150}
            style={{
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 20px 0',
              textAlign: 'center',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            Truck Command
          </h1>
          <p
            style={{
              fontSize: '28px',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              textAlign: 'center',
              maxWidth: '800px',
            }}
          >
            Trucking Business Management Software
          </p>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '40px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50px',
            padding: '15px 40px',
          }}
        >
          <span
            style={{
              fontSize: '22px',
              color: 'white',
              fontWeight: '500',
            }}
          >
            Invoicing  |  Dispatching  |  IFTA  |  Fleet Management
          </span>
        </div>

        {/* Bottom text */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            Start your free trial at truckcommand.com
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
