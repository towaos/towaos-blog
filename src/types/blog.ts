export interface BlogPost {
  slug: string;
  data: {
    title: string;
    description?: string;
    pubDate: Date;
    category: string;
    tags: string[];
  };
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
