'use client';
export default function AdminError({ retry }: { retry: () => void }) {
  return <div className="admin-panel p-6" role="alert"><h1 className="font-serif text-2xl">Connection unavailable</h1><p className="mt-3 text-muted">We could not load the saved data. Please try again in a moment.</p><button onClick={retry} className="mt-5 rounded-full bg-sage px-5 py-2 text-white">Retry</button></div>;
}
