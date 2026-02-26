export interface BlogPost {
  slug: string;
  data: {
    title: string;
    description?: string;
    pubDate: Date;
    updatedDate?: Date;
    category: string;
    tags: string[];
  };
}

/**
 * 表示用の日付を取得する。
 * updatedDate が存在する場合はそれを優先し、なければ pubDate を返す。
 */
export function getDisplayDate(data: BlogPost['data']): Date {
  return data.updatedDate ?? data.pubDate;
}

/**
 * 日付が更新日かどうかを判定する。
 */
export function isUpdatedDate(data: BlogPost['data']): boolean {
  return data.updatedDate != null;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export interface SearchablePost {
  element: HTMLElement;
  searchText: string;
}
