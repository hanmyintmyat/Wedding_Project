'use client';
export default function GlobalError({ retry }: { retry: () => void }) {
  return <html lang="en"><body style={{ margin: 0, background: '#fffaf2', color: '#443c35', fontFamily: 'Georgia, serif' }}><main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}><div><h1>Something went wrong.</h1><p>Please refresh and try again.</p><button onClick={retry} style={{ border: 0, borderRadius: 24, padding: '12px 24px', background: '#75856f', color: 'white', cursor: 'pointer' }}>Try again</button></div></main></body></html>;
}
