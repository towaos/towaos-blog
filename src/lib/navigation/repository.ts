import type { NavigationContext } from './domain';
import { STORAGE_KEY, DEFAULT_NAVIGATION } from './domain';

export class NavigationRepository {
  /**
   * セッションストレージから現在のナビゲーションコンテキストを取得
   */
  static get(): NavigationContext {
    if (typeof window === 'undefined') {
      return DEFAULT_NAVIGATION;
    }

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const context = JSON.parse(stored) as NavigationContext;
        // 5分以上古いコンテキストは無効とする
        const isExpired = Date.now() - context.timestamp > 5 * 60 * 1000;
        if (!isExpired) {
          return context;
        }
      }
    } catch (error) {
      console.error('Failed to get navigation context:', error);
    }

    return DEFAULT_NAVIGATION;
  }

  /**
   * セッションストレージにナビゲーションコンテキストを保存
   */
  static save(context: NavigationContext): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    } catch (error) {
      console.error('Failed to save navigation context:', error);
    }
  }

  /**
   * セッションストレージからナビゲーションコンテキストをクリア
   */
  static clear(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear navigation context:', error);
    }
  }
}
