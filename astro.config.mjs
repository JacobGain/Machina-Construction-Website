import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://machinaconstruction.com',
  output: 'static',
  build: { format: 'file' },
  devToolbar: { enabled: false },
  vite: {
    server: { proxy: { '/api': 'http://127.0.0.1:3000' } },
    plugins: [{
      name: 'existing-html-urls',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url) {
            req.url = req.url.replace(/^\/index\.html(?=\?|$)/, '/')
              .replace(/^\/(about|careers|contact|about-2|past-projects|404)\.html(?=\?|$)/, '/$1');
          }
          next();
        });
      },
    }],
  },
});
