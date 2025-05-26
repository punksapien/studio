import * as React from 'react';

export default function HomePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#F4F6FC' }}>
      <h1 style={{ fontSize: '2rem', color: '#0D0D39', marginBottom: '1rem' }}>Nobridge Home - Minimal Page</h1>
      <p style={{ color: '#2C3E50' }}>If you see this, the basic page routing is working.</p>
      <p style={{ color: '#2C3E50', marginTop: '2rem' }}>
        We can now try to re-apply the full homepage design.
      </p>
    </div>
  );
}
