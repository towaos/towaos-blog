import type { BlogPost } from '../types/blog';

export const POSTS_PER_PAGE = 10;

/**
 * ページネーションされた投稿を取得
 */
export function getPaginatedPosts(posts: BlogPost[], page: number) {
  const start = (page - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;
  return posts.slice(start, end);
}

/**
 * 総ページ数を計算
 */
export function getTotalPages(totalPosts: number): number {
  return Math.ceil(totalPosts / POSTS_PER_PAGE);
}

/**
 * ページURLを生成
 * @deprecated Use PaginationUseCase.generatePageUrl instead
 */
export function getPageUrl(page: number, baseUrl: string = '/'): string {
  return page === 1 ? baseUrl : `${baseUrl}/page/${page}`;
}

/**
 * 投稿を日付順にソート（updatedDate があればそれを優先）
 */
export function sortPostsByDate(posts: BlogPost[]): BlogPost[] {
  return posts.sort((a, b) => {
    const dateA = (a.data.updatedDate ?? a.data.pubDate).valueOf();
    const dateB = (b.data.updatedDate ?? b.data.pubDate).valueOf();
    return dateB - dateA;
  });
}

