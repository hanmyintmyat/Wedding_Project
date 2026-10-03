import { Prisma } from '@/generated/prisma/client';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError || error instanceof SyntaxError) {
    return Response.json({ error: 'Please check the submitted fields and try again.' }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return Response.json({ error: 'This record already exists.' }, { status: 409 });
    if (error.code === 'P2025') return Response.json({ error: 'This record no longer exists. Refresh and try again.' }, { status: 404 });
  }
  // Log a code only: connection strings and driver errors can contain credentials.
  console.error('[admin] Operation failed', error instanceof Prisma.PrismaClientKnownRequestError ? error.code : 'unavailable');
  return Response.json({ error: 'Could not connect to the database or storage. Please try again.' }, { status: 503 });
}
