export async function adminFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Could not save changes. Please try again.');
  return payload as T;
}
