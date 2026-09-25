import type { PostCard } from './types';

export const authorName = (p: PostCard) => p.author?.displayName ?? 'Deleted user';
