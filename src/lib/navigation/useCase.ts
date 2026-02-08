import type { NavigationContext } from './domain';
import { DEFAULT_NAVIGATION } from './domain';
import { NavigationRepository } from './repository';

export class NavigationUseCase {
  /**
   * リスト表示ページからのナビゲーションを記録
   * @param url - 現在のページURL
   * @param label - ページのラベル (例: "All posts", "Category: Tech", "Tag: astro")
   */
  static recordListNavigation(url: string, label: string): void {
    const context: NavigationContext = {
      from: url,
      label,
      timestamp: Date.now()
    };
    NavigationRepository.save(context);
  }

  /**
   * 保存されているナビゲーションコンテキストを取得
   */
  static getNavigationContext(): NavigationContext {
    return NavigationRepository.get();
  }

  /**
   * ナビゲーションコンテキストをクリア
   */
  static clearNavigationContext(): void {
    NavigationRepository.clear();
  }

  /**
   * URLからラベルを生成
   */
  static generateLabel(pathname: string): string {
    // ルートページ
    if (pathname === '/' || pathname === '') {
      return 'All posts';
    }

    // ページネーション: /page/2
    const pageMatch = pathname.match(/^\/page\/(\d+)$/);
    if (pageMatch) {
      return `All posts (Page ${pageMatch[1]})`;
    }

    // カテゴリ: /categories/tech または /categories/tech/page/2
    const categoryMatch = pathname.match(/^\/categories\/([^\/]+)(\/page\/(\d+))?$/);
    if (categoryMatch) {
      const category = decodeURIComponent(categoryMatch[1]);
      const page = categoryMatch[3];
      const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
      return page ? `Category: ${categoryLabel} (Page ${page})` : `Category: ${categoryLabel}`;
    }

    // タグ: /tags/astro または /tags/astro/page/2
    const tagMatch = pathname.match(/^\/tags\/([^\/]+)(\/page\/(\d+))?$/);
    if (tagMatch) {
      const tag = decodeURIComponent(tagMatch[1]);
      const page = tagMatch[3];
      const tagLabel = tag.charAt(0).toUpperCase() + tag.slice(1);
      return page ? `Tag: ${tagLabel} (Page ${page})` : `Tag: ${tagLabel}`;
    }

    return 'All posts';
  }

  /**
   * 現在のページのフルURLを取得
   */
  static getCurrentUrl(): string {
    if (typeof window === 'undefined') {
      return '/';
    }
    return window.location.pathname;
  }
}
