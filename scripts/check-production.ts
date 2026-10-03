import dotenv from 'dotenv';
import { validatePostgresUrl } from '../lib/postgres-config';
dotenv.config({ path: '.env.production.local', quiet: true });
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });
const failures: string[] = [];
for (const key of ['DATABASE_URL', 'DIRECT_URL', 'AUTH_SECRET', 'NEXTAUTH_URL', 'NEXT_PUBLIC_SITE_URL', 'BLOB_READ_WRITE_TOKEN', 'ADMIN_EMAIL', 'ADMIN_PASSWORD']) {
  if (!process.env[key]?.trim()) failures.push(`${key} is required.`);
}
for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
  const validation = validatePostgresUrl(process.env[key], key === 'DIRECT_URL');
  if (!validation.ok) failures.push(validation.message);
}
try {
  const pooled = new URL(process.env.DATABASE_URL || '');
  const direct = new URL(process.env.DIRECT_URL || '');
  if (pooled.pathname !== direct.pathname || pooled.username !== direct.username) failures.push('DATABASE_URL and DIRECT_URL must refer to the same Prisma Postgres database and role.');
} catch { /* Invalid URLs are already reported above. */ }
for (const key of ['NEXTAUTH_URL', 'NEXT_PUBLIC_SITE_URL']) {
  try {
    const url = new URL(process.env[key] || '');
    if (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname)) failures.push(`${key} must be a public HTTPS URL.`);
  } catch { failures.push(`${key} must be a valid URL.`); }
}
if (process.env.NEXTAUTH_URL?.replace(/\/$/, '') !== process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')) failures.push('NEXTAUTH_URL and NEXT_PUBLIC_SITE_URL must match.');
if ((process.env.AUTH_SECRET?.length || 0) < 32) failures.push('AUTH_SECRET must have at least 32 characters.');
if ((process.env.ADMIN_PASSWORD?.length || 0) < 12 || process.env.ADMIN_PASSWORD === 'ChangeMe123!') failures.push('Choose an ADMIN_PASSWORD of at least 12 characters.');
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('Production environment checks passed.');
