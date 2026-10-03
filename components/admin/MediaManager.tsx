'use client';

import Image from 'next/image';
import { ZodError } from 'zod';
import { Upload } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { upload } from '@vercel/blob/client';
import { adminFetch } from '@/lib/admin-fetch';
import { preparePhoto } from '@/lib/prepare-photo';
import { uploadMetaSchema } from '@/lib/media-validation';

type Asset = { id: string; type: 'HERO' | 'GROOM' | 'BRIDE' | 'GALLERY' | 'MUSIC'; url: string; alt: string | null; sortOrder: number };
export default function MediaManager({ initialAssets }: { initialAssets: Asset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [type, setType] = useState<Asset['type']>('HERO');
  const [replaceId, setReplaceId] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    setMessage(''); setBusy(true); setProgress(0);
    try {
      let file = values.get('file');
      if (!(file instanceof File) || !file.size) throw new Error('Choose a file to upload.');
      if (type !== 'MUSIC') {
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) throw new Error('Choose JPG, PNG, WebP, or AVIF photos.');
        file = await preparePhoto(file);
      }
      const meta = uploadMetaSchema.parse({ type, alt: values.get('alt') || '', sortOrder: Number(values.get('sortOrder') || 0), replaceId: replaceId || undefined, filename: file.name, contentType: file.type, size: file.size });
      const id = crypto.randomUUID();
      const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const blob = await upload(`wedding/${id}/${filename}`, file, {
        access: 'public', handleUploadUrl: '/api/admin/media/upload',
        clientPayload: JSON.stringify(meta),
        onUploadProgress: event => setProgress(Math.round(event.percentage))
      });
      // Finalize immediately; signed callbacks retry independently if the browser closes.
      await adminFetch<Asset>('/api/admin/media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, url: blob.url }) });
      setAssets(await adminFetch<Asset[]>('/api/admin/media'));
      setMessage('Media saved. The public invitation is updated.');
      setReplaceId(''); form.reset();
    } catch (error) { setMessage(error instanceof ZodError ? error.issues[0]?.message || 'Check the selected file.' : error instanceof Error ? error.message : 'Upload failed. Please try again.'); }
    finally { setBusy(false); }
  }

  async function remove(asset: Asset) {
    if (busy) return;
    setBusy(true);
    try {
      await adminFetch(`/api/admin/media?id=${encodeURIComponent(asset.id)}`, { method: 'DELETE' });
      setAssets(current => current.filter(item => item.id !== asset.id));
      setMessage('Media deleted.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not delete media.'); }
    finally { setBusy(false); }
  }

  async function move(asset: Asset, direction: number) {
    if (busy) return;
    const gallery = assets.filter(item => item.type === 'GALLERY').sort((a, b) => a.sortOrder - b.sortOrder);
    const position = gallery.findIndex(item => item.id === asset.id);
    const target = position + direction;
    if (target < 0 || target >= gallery.length) return;
    [gallery[position], gallery[target]] = [gallery[target], gallery[position]];
    setBusy(true);
    try {
      await Promise.all(gallery.map((item, sortOrder) => adminFetch('/api/admin/media', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, sortOrder }) })));
      setAssets(await adminFetch<Asset[]>('/api/admin/media')); setMessage('Gallery order saved.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not reorder gallery.'); }
    finally { setBusy(false); }
  }

  return <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
    <form onSubmit={submit} className="admin-panel grid content-start gap-4 p-5">
      <h2 className="font-serif text-2xl">{replaceId ? 'Replace Media' : 'Upload Media'}</h2>
      <p className="text-sm leading-6 text-muted">Photos are resized automatically for fast mobile loading. Music supports MP3, M4A, or OGG up to 15 MB.</p>
      <label className="admin-label">Media Type<select name="type" value={type} disabled={busy} onChange={event => { setType(event.target.value as Asset['type']); setReplaceId(''); }} className="admin-input"><option value="HERO">Main Hero Photo</option><option value="GROOM">Groom Photo</option><option value="BRIDE">Bride Photo</option><option value="GALLERY">Gallery Image</option><option value="MUSIC">Background Music</option></select></label>
      <label className="admin-label">Alt / Music Title<input name="alt" maxLength={160} className="admin-input" /></label>
      <label className="admin-label">Sort Order<input name="sortOrder" type="number" min={0} defaultValue={0} className="admin-input" /></label>
      <label className="admin-label">File<input name="file" type="file" accept={type === 'MUSIC' ? '.mp3,.m4a,.ogg' : '.jpg,.jpeg,.png,.webp,.avif'} className="admin-input" required disabled={busy} /></label>
      <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-full bg-sage px-5 py-2 text-sm font-bold text-white disabled:opacity-60"><Upload className="h-4 w-4" />{busy ? `Saving… ${progress}%` : replaceId ? 'Replace' : 'Upload'}</button>
      {replaceId && <button type="button" disabled={busy} onClick={() => setReplaceId('')} className="text-sm text-sage">Cancel replacement</button>}
      <p role="status" className="break-words text-sm leading-6 text-muted">{message}</p>
    </form>
    <div className="admin-panel p-5"><h2 className="font-serif text-2xl">Media Library</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{assets.map(asset => <div key={asset.id} className="min-w-0 overflow-hidden rounded-2xl border border-sage/15 bg-white/65">
        {asset.type === 'MUSIC' ? <div className="grid aspect-[4/3] content-center gap-4 p-4 text-center text-sage"><p>{asset.alt || 'Music File'}</p><audio controls preload="none" src={asset.url} className="w-full" /></div> : <div className="relative aspect-[4/3]"><Image src={asset.url} alt={asset.alt || asset.type} fill sizes="(max-width: 640px) 90vw, (max-width: 1280px) 40vw, 25vw" className="object-cover" /></div>}
        <div className="p-3 text-sm"><p className="font-bold text-ink">{asset.type}</p><p className="truncate text-xs text-muted">{asset.alt || asset.url}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sage"><button type="button" disabled={busy} onClick={() => { setType(asset.type); setReplaceId(asset.id); setMessage('Choose the replacement file and click Replace.'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Replace</button><button type="button" disabled={busy} onClick={() => remove(asset)} className="text-red-700">Delete</button>
          {asset.type === 'GALLERY' && <><button type="button" disabled={busy} aria-label={`Move ${asset.alt || 'photo'} earlier`} onClick={() => move(asset, -1)}>← Earlier</button><button type="button" disabled={busy} aria-label={`Move ${asset.alt || 'photo'} later`} onClick={() => move(asset, 1)}>Later →</button></>}</div>
        </div></div>)}</div></div>
  </div>;
}
