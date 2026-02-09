/**
 * Pagination Use Case Layer
 * ページネーションのアプリケーションロジックを定義
 */

import { PaginationState, PaginationButton } from './domain.js';

/**
 * ページネーションの表示用データ
 */
export interface PaginationViewModel {
  currentPage: number;
  totalPages: number;
  previousButton: PaginationButton;
  nextButton: PaginationButton;
  pages: Array<{ number: number; isCurrent: boolean }>;
}

/**
 * ページネーションのユースケース
 */
export class PaginationUseCase {
  /**
   * ページネーションのViewModel生成
   */
  static createViewModel(
    currentPage: number,
    totalPages: number
  ): PaginationViewModel {
    const state = new PaginationState(currentPage, totalPages);

    // 前へボタンの状態
    const previousButton = new PaginationButton(
      !state.hasPrevious,
      state.getPreviousPage(),
      '前のページへ'
    );

    // 次へボタンの状態
    const nextButton = new PaginationButton(
      !state.hasNext,
      state.getNextPage(),
      '次のページへ'
    );

    // ページ番号リスト
    const pages = state.getAllPageNumbers().map((pageNum) => ({
      number: pageNum,
      isCurrent: pageNum === currentPage,
    }));

    return {
      currentPage,
      totalPages,
      previousButton,
      nextButton,
      pages,
    };
  }

  /**
   * ページURLを生成
   */
  static generatePageUrl(page: number, baseUrl: string): string {
    if (page === 1) {
      return baseUrl;
    }
    if (baseUrl === '/') {
      return `/page/${page}`;
    }
    return `${baseUrl}/page/${page}`;
  }
}
