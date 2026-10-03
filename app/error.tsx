'use client';
export default function ErrorPage({ retry }: { retry: () => void }) {
  return <main className="grid min-h-dvh place-items-center bg-ivory p-6 text-center"><div><h1 className="font-serif text-3xl">Something went wrong.</h1><p className="mt-4 text-muted">Please refresh and try again.</p><button onClick={retry} className="mt-6 rounded-full bg-sage px-6 py-3 text-white">Try again</button></div></main>;
}
