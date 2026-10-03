import { getDatabaseHealth } from '@/lib/database';
export const runtime = 'nodejs';
export async function GET() {
  const health = await getDatabaseHealth();
  return Response.json({ app: 'ok', database: health.connected ? 'ok' : 'error' }, {
    status: health.connected ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' }
  });
}
