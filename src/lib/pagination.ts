import type { BlogPost } from '../types/blog';

export const POSTS_PER_PAGE = 7;

export function getPaginatedPosts(posts: BlogPost[], page: number) {
  const start = (page - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;
  return posts.slice(start, end);
}

export function getTotalPages(totalPosts: number): number {
  return Math.ceil(totalPosts / POSTS_PER_PAGE);
}

export function getPageUrl(page: number, baseUrl: string = '/'): string {
  return page === 1 ? baseUrl : `${baseUrl}/page/${page}`;
}

export function sortPostsByDate(posts: BlogPost[]): BlogPost[] {
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
