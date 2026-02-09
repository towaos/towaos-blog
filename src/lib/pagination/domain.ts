/**
 * Pagination Domain Layer
 * ページネーションのビジネスロジックとエンティティを定義
 */

/**
 * ページネーションの状態を表すValue Object
 */
export class PaginationState {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly hasPrevious: boolean;
  readonly hasNext: boolean;

  constructor(currentPage: number, totalPages: number) {
    if (currentPage < 1) {
      throw new Error('Current page must be greater than or equal to 1');
    }
    if (totalPages < 1) {
      throw new Error('Total pages must be greater than or equal to 1');
    }
    if (currentPage > totalPages) {
      throw new Error('Current page cannot exceed total pages');
    }

    this.currentPage = currentPage;
    this.totalPages = totalPages;
    this.hasPrevious = currentPage > 1;
    this.hasNext = currentPage < totalPages;
  }

  /**
   * 前のページ番号を取得
   */
  getPreviousPage(): number | null {
    return this.hasPrevious ? this.currentPage - 1 : null;
  }

  /**
   * 次のページ番号を取得
   */
  getNextPage(): number | null {
    return this.hasNext ? this.currentPage + 1 : null;
  }

  /**
   * 指定したページが有効かどうか
   */
  isValidPage(page: number): boolean {
    return page >= 1 && page <= this.totalPages;
  }

  /**
   * ページ番号の配列を取得
   */
  getAllPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}

/**
 * ページネーションボタンの状態を表すValue Object
 */
export class PaginationButton {
  readonly isDisabled: boolean;
  readonly targetPage: number | null;
  readonly ariaLabel: string;

  constructor(
    isDisabled: boolean,
    targetPage: number | null,
    ariaLabel: string
  ) {
    this.isDisabled = isDisabled;
    this.targetPage = targetPage;
    this.ariaLabel = ariaLabel;
  }
}
