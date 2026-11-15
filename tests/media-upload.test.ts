import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { mock, test } from 'node:test';
import { Prisma } from '../generated/prisma/client';
import { getPrismaClient } from '../lib/db';
import { completeMediaUpload, deleteBlobIfUnused } from '../lib/media';
import { uploadMetaSchema, IMAGE_LIMIT } from '../lib/media-validation';
import { uploadMedia } from '../lib/media-upload';
import { POST as tokenRequest } from '../app/api/admin/media/upload/route';
import { GET as mediaList, POST as finalize, DELETE as remove } from '../app/api/admin/media/route';

const dependency = createRequire(`${process.cwd()}/package.json`);
const blobSdk = dependency('@vercel/blob') as typeof import('@vercel/blob');
const blobClient = dependency('@vercel/blob/client') as typeof import('@vercel/blob/client');
const nextAuth = dependency('next-auth/next') as typeof import('next-auth/next');
const cache = dependency('next/cache') as typeof import('next/cache');
type Kind = 'HERO' | 'GROOM' | 'BRIDE' | 'GALLERY' | 'MUSIC';
type Asset = { id: string; type: Kind; url: string; alt: string | null; sortOrder: number };
type Intent = Omit<Asset, 'url'> & { pathname: string; replaceId?: string; completedAt?: Date };

function request(body: unknown, origin = 'https://wedding.example', method = 'POST', path = '/api/admin/media/upload', signature?: string) {
  return new Request(`https://wedding.example${path}`, {
    method,
    headers: { origin, 'Content-Type': 'application/json', ...(signature ? { 'x-vercel-signature': signature } : {}) },
    ...(method === 'DELETE' ? {} : { body: JSON.stringify(body) })
  });
}

test('admin media lifecycle keeps tokens private, validates uploads and preserves replacement safety', async t => {
  const environment = { ...process.env };
  const shared = globalThis as typeof globalThis & { postgresPrisma7?: ReturnType<typeof getPrismaClient> };
  const previousClient = shared.postgresPrisma7;
  // Synthetic credentials sign only local SDK test tokens. Blob network methods
  // and the database are mocked; no production credentials or records are used.
  const readWriteToken = `vercel_blob_rw_unitstore_${randomUUID()}`;
  process.env.BLOB_READ_WRITE_TOKEN = readWriteToken;
  process.env.DATABASE_URL = 'postgresql://test:test@pooled.db.prisma.io/test?sslmode=require';
  process.env.VERCEL_BLOB_CALLBACK_URL = 'https://wedding.example';
  let authenticated = true;
  const assets = new Map<string, Asset>();
  const intents = new Map<string, Intent>();
  const blobs = new Map<string, { url: string; contentType: string; size: number }>();
  const events: string[] = [];
  let failCommit = false;
  const authMock = mock.method(nextAuth, 'getServerSession', async () => authenticated ? { user: { id: 'test-admin', role: 'ADMIN' } } : null);
  const tagMock = mock.method(cache, 'revalidateTag', () => events.push('invalidate-tag'));
  const pathMock = mock.method(cache, 'revalidatePath', (path: string) => events.push(`invalidate:${path}`));
  const headMock = mock.method(blobSdk, 'head', async (pathname: string) => {
    assert.ok(blobs.has(pathname));
    events.push('head');
    return blobs.get(pathname);
  });
  const deleteMock = mock.method(blobSdk, 'del', async (url: string) => {
    assert.equal([...assets.values()].some(asset => asset.url === url), false, 'never delete a referenced blob');
    events.push(`delete-blob:${url}`);
  });
  const db = {
    mediaUpload: {
      create: async ({ data }: { data: Intent }) => { intents.set(data.id, { ...data }); return data; },
      findUnique: async ({ where }: { where: { id: string } }) => intents.get(where.id) || null,
      findUniqueOrThrow: async ({ where }: { where: { id: string } }) => {
        const value = intents.get(where.id); assert.ok(value); return value;
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<Intent> }) => Object.assign(intents.get(where.id)!, data)
    },
    mediaAsset: {
      findUnique: async ({ where }: { where: { id: string } }) => assets.get(where.id) || null,
      findMany: async ({ where }: { where?: { id?: string; type?: Kind } } = {}) => [...assets.values()].filter(asset => !where || (where.id ? asset.id === where.id : asset.type === where.type)),
      count: async ({ where }: { where: { url: string } }) => [...assets.values()].filter(asset => asset.url === where.url).length,
      create: async ({ data }: { data: Asset }) => { assets.set(data.id, { ...data }); events.push('create-media'); return data; },
      deleteMany: async ({ where }: { where: { id: { in: string[] } } }) => { for (const id of where.id.in) assets.delete(id); events.push('remove-old-records'); },
      delete: async ({ where }: { where: { id: string } }) => { const asset = assets.get(where.id); assert.ok(asset); assets.delete(where.id); events.push('delete-record'); return asset; }
    },
    $transaction: async (work: (tx: unknown) => Promise<unknown>) => {
      const beforeAssets = structuredClone(assets);
      const beforeIntents = structuredClone(intents);
      try {
        const result = await work(db);
        if (failCommit) throw new Error('synthetic database failure');
        events.push('commit');
        return result;
      } catch (error) {
        assets.clear(); for (const [key, value] of beforeAssets) assets.set(key, value);
        intents.clear(); for (const [key, value] of beforeIntents) intents.set(key, value);
        throw error;
      }
    }
  };
  shared.postgresPrisma7 = db as unknown as ReturnType<typeof getPrismaClient>;
  async function authorize(type: Kind, replaceId?: string) {
    const id = randomUUID();
    const pathname = `wedding/${id}/test.webp`;
    const meta = { type, replaceId, alt: 'Synthetic test image', sortOrder: 0, filename: 'test.webp', contentType: 'image/webp', size: 128 };
    const body = { type: 'blob.generate-client-token', payload: { pathname, clientPayload: JSON.stringify(meta), multipart: false } };
    const response = await tokenRequest(request(body));
    return { id, pathname, meta, body, response };
  }
  function addBlob(pathname: string) {
    const blob = { url: `https://unitstore.public.blob.vercel-storage.com/${pathname}`, contentType: 'image/webp', size: 128 };
    blobs.set(pathname, blob);
    return blob;
  }
  try {
    await t.test('token endpoint rejects logged-out and cross-origin requests before checking storage', async () => {
      delete process.env.BLOB_READ_WRITE_TOKEN;
      authenticated = false;
      assert.equal((await authorize('GALLERY')).response.status, 401);
      const blocked = await tokenRequest(request({ type: 'blob.generate-client-token' }, 'https://untrusted.example'));
      assert.equal(blocked.status, 403);
      assert.equal(intents.size, 0);
      authenticated = true;
      const missing = (await authorize('GALLERY')).response;
      assert.equal(missing.status, 503);
      assert.match((await missing.json()).error, /Media upload is not configured for this deployment/);
      process.env.BLOB_READ_WRITE_TOKEN = readWriteToken;
    });

    await t.test('gallery authorization returns a constrained client token and finalization refreshes both pages', async () => {
      const upload = await authorize('GALLERY');
      assert.equal(upload.response.status, 200);
      const response = await upload.response.json();
      assert.ok(response.clientToken.startsWith('vercel_blob_client_'));
      assert.ok(!JSON.stringify(response).includes(readWriteToken));
      const constraints = blobClient.getPayloadFromClientToken(response.clientToken);
      assert.equal(constraints.pathname, upload.pathname);
      assert.deepEqual(constraints.allowedContentTypes, ['image/webp']);
      assert.equal(constraints.maximumSizeInBytes, 128);
      assert.equal(constraints.allowOverwrite, false);
      const blob = addBlob(upload.pathname);
      const saved = await finalize(request({ id: upload.id, url: blob.url }, undefined, 'POST', '/api/admin/media'));
      assert.equal(saved.status, 201);
      assert.equal((await saved.json()).url, blob.url);
      assert.equal((await (await mediaList()).json()).some((asset: Asset) => asset.id === upload.id), true);
      for (const path of ['/', '/invite', '/admin/media']) assert.ok(events.includes(`invalidate:${path}`));
    });

    for (const type of ['HERO', 'GROOM', 'BRIDE', 'GALLERY'] as const) {
      await t.test(`${type} replacement saves the new URL before deleting the old object`, async () => {
        const old = { id: randomUUID(), type, url: addBlob(`wedding/${randomUUID()}/old.webp`).url, alt: 'Previous photo', sortOrder: 0 };
        assets.set(old.id, old);
        const upload = await authorize(type, old.id);
        assert.equal(upload.response.status, 200);
        const blob = addBlob(upload.pathname);
        const start = events.length;
        const saved = await completeMediaUpload(upload.id, blob.url);
        assert.equal(saved?.url, blob.url);
        assert.equal(assets.has(old.id), false);
        const lifecycle = events.slice(start);
        assert.ok(lifecycle.indexOf('commit') < lifecycle.indexOf(`delete-blob:${old.url}`));
        assert.ok(lifecycle.includes(`delete-blob:${old.url}`));
        const count = deleteMock.mock.callCount();
        await completeMediaUpload(upload.id, blob.url);
        assert.equal(deleteMock.mock.callCount(), count, 'completion is idempotent');
      });
    }

    await t.test('signed callbacks work without a browser session and cannot be forged', async () => {
      const upload = await authorize('GALLERY');
      const blob = addBlob(upload.pathname);
      const body = { type: 'blob.upload-completed', payload: { blob, tokenPayload: JSON.stringify({ id: upload.id }) } };
      authenticated = false;
      assert.equal((await tokenRequest(request(body))).status, 403);
      assert.equal((await tokenRequest(request(body, undefined, 'POST', undefined, '00'.repeat(32)))).status, 403);
      const signature = createHmac('sha256', readWriteToken).update(JSON.stringify(body)).digest('hex');
      assert.equal((await tokenRequest(request(body, undefined, 'POST', undefined, signature))).status, 200);
      assert.equal(assets.get(upload.id)?.url, blob.url);
      authenticated = true;
    });

    await t.test('failed validation or database commit preserves the original photo', async () => {
      const old = { id: randomUUID(), type: 'HERO' as const, url: addBlob(`wedding/${randomUUID()}/original.webp`).url, alt: null, sortOrder: 0 };
      assets.set(old.id, old);
      const upload = await authorize('HERO', old.id);
      const blob = addBlob(upload.pathname);
      const deletions = deleteMock.mock.callCount();
      await assert.rejects(completeMediaUpload(upload.id, `${blob.url}-wrong`));
      blob.contentType = 'text/html';
      await assert.rejects(completeMediaUpload(upload.id, blob.url));
      blob.contentType = 'image/webp'; blob.size = IMAGE_LIMIT + 1;
      await assert.rejects(completeMediaUpload(upload.id, blob.url));
      blob.size = 128; failCommit = true;
      await assert.rejects(completeMediaUpload(upload.id, blob.url));
      failCommit = false;
      assert.deepEqual(assets.get(old.id), old);
      assert.equal(assets.has(upload.id), false);
      assert.equal(deleteMock.mock.callCount(), deletions);
    });

    await t.test('deletion requires admin access, removes the record first and protects shared/static files', async () => {
      const gallery = [...assets.values()].find(asset => asset.type === 'GALLERY')!;
      authenticated = false;
      assert.equal((await remove(request(null, undefined, 'DELETE', `/api/admin/media?id=${gallery.id}`))).status, 401);
      assert.equal(assets.has(gallery.id), true);
      authenticated = true;
      const start = events.length;
      assert.equal((await remove(request(null, undefined, 'DELETE', `/api/admin/media?id=${gallery.id}`))).status, 200);
      assert.equal(assets.has(gallery.id), false);
      const lifecycle = events.slice(start);
      assert.ok(lifecycle.indexOf('delete-record') < lifecycle.indexOf(`delete-blob:${gallery.url}`));
      const deletions = deleteMock.mock.callCount();
      for (const url of ['/images/current/hero.webp', 'https://unitstore.public.blob.vercel-storage.com/wedding/initial/hero.webp', 'https://example.com/wedding/photo.webp', 'not a URL']) await deleteBlobIfUnused(url);
      const sharedAsset = [...assets.values()][0];
      await deleteBlobIfUnused(sharedAsset.url);
      assert.equal(deleteMock.mock.callCount(), deletions);
    });

    await t.test('invalid metadata, paths, filenames and replacement targets never mint a token', async () => {
      const upload = await authorize('GALLERY');
      for (const changed of [
        { ...upload.body, payload: { ...upload.body.payload, pathname: 'wedding/initial/photo.webp' } },
        { ...upload.body, payload: { ...upload.body.payload, pathname: `wedding/${randomUUID()}/other.webp` } },
        { ...upload.body, payload: { ...upload.body.payload, clientPayload: JSON.stringify({ ...upload.meta, size: IMAGE_LIMIT + 1 }) } },
        { ...upload.body, payload: { ...upload.body.payload, clientPayload: JSON.stringify({ ...upload.meta, contentType: 'text/html' }) } },
        { ...upload.body, payload: { ...upload.body.payload, clientPayload: JSON.stringify({ ...upload.meta, replaceId: randomUUID() }) } },
        { type: 'blob.generate-client-token' }, null
      ]) {
        assert.equal((await tokenRequest(request(changed))).status, 400);
      }
    });

    await t.test('missing existing migration produces a safe setup error', async () => {
      const failed = mock.method(db.mediaUpload, 'create', async () => { throw new Prisma.PrismaClientKnownRequestError('synthetic', { code: 'P2021', clientVersion: '7.10.0' }); });
      try {
        const response = (await authorize('GALLERY')).response;
        assert.equal(response.status, 503);
        assert.match((await response.json()).error, /Apply the existing migrations/);
      } finally { failed.mock.restore(); }
    });
  } finally {
    for (const stub of [authMock, tagMock, pathMock, headMock, deleteMock]) stub.mock.restore();
    shared.postgresPrisma7 = previousClient;
    for (const key of Object.keys(process.env)) if (!(key in environment)) delete process.env[key];
    Object.assign(process.env, environment);
  }
});

test('client token exchange preserves safe endpoint errors and sends only a constrained token to Blob', async () => {
  const file = new File([new Uint8Array(128)], 'photo.webp', { type: 'image/webp' });
  const meta = uploadMetaSchema.parse({ type: 'GALLERY', alt: '', sortOrder: 0, filename: file.name, contentType: file.type, size: file.size });
  const pathname = `wedding/${randomUUID()}/${file.name}`;
  const clientToken = 'vercel_blob_client_unitstore_synthetic';
  const put = mock.method(blobClient, 'put', async () => ({ url: 'https://unitstore.public.blob.vercel-storage.com/test.webp' }));
  const fetch = mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Media upload is not configured for this deployment.' }, { status: 503 }));
  try {
    await assert.rejects(uploadMedia(pathname, file, meta, () => {}), /Media upload is not configured/);
    assert.equal(put.mock.callCount(), 0);
    fetch.mock.mockImplementation(async () => new Response('<html>upstream failure</html>', { status: 401 }));
    await assert.rejects(uploadMedia(pathname, file, meta, () => {}), /Please sign in to the admin dashboard/);
    fetch.mock.mockImplementation(async () => Response.json({ clientToken: 'unexpected-token' }));
    await assert.rejects(uploadMedia(pathname, file, meta, () => {}), /Unable to start upload/);
    assert.equal(put.mock.callCount(), 0);
    fetch.mock.mockImplementation(async (url, options) => {
      assert.equal(url, '/api/admin/media/upload');
      assert.equal(options?.credentials, 'same-origin');
      const body = JSON.parse(String(options?.body));
      assert.equal(body.type, 'blob.generate-client-token');
      assert.equal(body.payload.pathname, pathname);
      return Response.json({ clientToken });
    });
    await uploadMedia(pathname, file, meta, () => {});
    assert.equal(put.mock.callCount(), 1);
    const options = put.mock.calls[0].arguments[2];
    assert.equal(options?.token, clientToken);
    assert.equal(options?.contentType, 'image/webp');
    assert.equal(options?.access, 'public');
  } finally { put.mock.restore(); fetch.mock.restore(); }
});
