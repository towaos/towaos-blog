// Domain Models
export interface NavigationContext {
  from: string;
  label: string;
  timestamp: number;
}

export interface NavigationState {
  context: NavigationContext | null;
}

// Domain Constants
export const DEFAULT_NAVIGATION: NavigationContext = {
  from: '/',
  label: 'All posts',
  timestamp: Date.now()
};

export const STORAGE_KEY = 'blog_navigation_context';
