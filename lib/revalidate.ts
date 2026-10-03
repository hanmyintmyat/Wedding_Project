import { revalidatePath, revalidateTag } from 'next/cache';

export function invalidateWeddingContent() {
  // Immediate expiration: the next public refresh sees the saved edit.
  revalidateTag('wedding-content', { expire: 0 });
  revalidatePath('/');
  revalidatePath('/invite');
}
