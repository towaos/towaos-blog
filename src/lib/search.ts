interface SearchResult {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  pubDate: string;
  content: string;
}

// グローバル検索: 全投稿からの検索結果を返す(ファイル名、タイトル、説明、本文を検索)
export async function searchAllPosts(query: string): Promise<SearchResult[]> {
  if (!query) return [];
  
  try {
    const response = await fetch('/api/posts.json');
    const allPosts: SearchResult[] = await response.json();
    
    const lowerQuery = query.toLowerCase();
    
    return allPosts.filter(post => {
      // ファイル名(slug)、タイトル、説明、本文、カテゴリ、タグを全て検索対象に
      const searchText = `${post.slug} ${post.title} ${post.description} ${post.content} ${post.category} ${post.tags.join(' ')}`.toLowerCase();
      return searchText.includes(lowerQuery);
    });
  } catch (error) {
    console.error('Failed to search posts:', error);
    return [];
  }
}

// グローバル検索ハンドラー(全投稿を対象に検索し、結果を動的に表示)
export function createGlobalSearchHandler(
  searchInputSelector: string = '#searchInput',
  postListSelector: string = '#postList',
  postCountSelector: string = '#postCount'
) {
  const searchInput = document.querySelector(searchInputSelector) as HTMLInputElement;
  const postList = document.querySelector(postListSelector) as HTMLElement;
  const postCount = document.querySelector(postCountSelector) as HTMLElement;

  if (!searchInput || !postList) return;

  const originalItems = postList.innerHTML;
  const originalCount = postList.querySelectorAll('.item').length;

  let debounceTimeout: number;

  searchInput.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value.trim();
    
    // デバウンス処理
    clearTimeout(debounceTimeout);
    
    if (!query) {
      // 空の検索なら元の表示に戻す
      postList.innerHTML = originalItems;
      if (postCount) {
        postCount.textContent = originalCount.toString();
      }
      return;
    }

    debounceTimeout = window.setTimeout(async () => {
      try {
        const results = await searchAllPosts(query);
        
        if (results.length === 0) {
          postList.innerHTML = '<div class="empty">検索結果が見つかりませんでした。</div>';
          if (postCount) {
            postCount.textContent = '0';
          }
        } else {
          // 検索結果を表示
          postList.innerHTML = results.map(post => {
            const date = new Date(post.pubDate);
            const formattedDate = date.toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            
            return `
            <a href="/${post.slug}" class="item post-item">
              <div class="post-title">${post.title}</div>
              ${post.description ? `<div class="post-excerpt">${post.description}</div>` : ''}
              <div class="post-date">${formattedDate}</div>
              <div class="post-divider"></div>
              <div class="post-tags-row">
                <span class="chip category-chip">${post.category}</span>
                ${post.tags.slice(0, 3).map(tag => `<span class="chip tag-chip">#${tag}</span>`).join('')}
                ${post.tags.length > 3 ? `<span class="more-tags">+${post.tags.length - 3}</span>` : ''}
              </div>
            </a>
          `}).join('');
          
          if (postCount) {
            postCount.textContent = results.length.toString();
          }
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300);
  });
}
