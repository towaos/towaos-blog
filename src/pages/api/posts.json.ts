import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const allPosts = await getCollection('blog');
  
  const posts = allPosts.map(post => ({
    slug: post.slug,
    title: post.data.title,
    description: post.data.description || '',
    category: post.data.category,
    tags: post.data.tags,
    pubDate: post.data.pubDate.toISOString(),
  }));

  return new Response(JSON.stringify(posts), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
