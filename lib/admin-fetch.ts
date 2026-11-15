export async function adminFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const fallback = response.status === 401 ? 'Please sign in to the admin dashboard.'
      : response.status === 403 ? 'This request is not allowed. Refresh the admin dashboard and try again.'
      : 'Could not save changes. Please try again.';
    throw new Error(typeof payload?.error === 'string' ? payload.error : fallback);
  }
  if (payload === null) throw new Error('The server returned an unexpected response. Refresh the admin dashboard and try again.');
  return payload as T;
}
