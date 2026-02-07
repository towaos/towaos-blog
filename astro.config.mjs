// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// export default defineConfig({
//   site: 'https://example.com',
//   integrations: [mdx(), sitemap()],

//   vite: {
//     plugins: [tailwindcss()],
//   },
// });


// https://astro.build/config
export default defineConfig({
  markdown: {
    shikiConfig: {
      // VSCode Dark+ テーマを使用
      theme: 'dark-plus',
      // 言語を追加
      langs: [],
    },
  },
});
