interface SearchResult {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  pubDate: string;
}

// グローバル検索: 全投稿からの検索結果を返す
export async function searchAllPosts(query: string): Promise<SearchResult[]> {
  if (!query) return [];
  
  try {
    const response = await fetch('/api/posts.json');
    const allPosts: SearchResult[] = await response.json();
    
    const lowerQuery = query.toLowerCase();
    
    return allPosts.filter(post => {
      const searchText = `${post.title} ${post.description} ${post.category} ${post.tags.join(' ')}`.toLowerCase();
      return searchText.includes(lowerQuery);
    });
  } catch (error) {
    console.error('Failed to search posts:', error);
    return [];
  }
}

// グローバル検索ハンドラー（全投稿を対象に検索し、結果を動的に表示）
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
          postList.innerHTML = '<div class="empty" style="padding: 18px; color: var(--muted);">検索結果が見つかりませんでした。</div>';
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
            <a href="/${post.slug}" class="item">
              <div class="title">${post.title}</div>
              <div class="meta">
                <span>${formattedDate}</span>
                <span>•</span>
                <span class="chip">${post.category}</span>
                ${post.tags.length > 0 ? `
                  <span>•</span>
                  ${post.tags.slice(0, 2).map(tag => `<span class="chip">#${tag}</span>`).join('')}
                  ${post.tags.length > 2 ? '<span class="more-tags">...</span>' : ''}
                ` : ''}
              </div>
              ${post.description ? `<div class="excerpt">${post.description}</div>` : ''}
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
