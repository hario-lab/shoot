import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { execSync } from 'child_process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // GitHub Pages: set VITE_BASE_PATH=/repo-name/ in .env or CI environment.
  // vite-plugin-singlefile inlines all assets, so './' works for most cases.
  const base = env.VITE_BASE_PATH || './';

  return {
    base,
    plugins: [
      react(),
      viteSingleFile(),
      {
        name: 'attack-api',
        configureServer(server) {
          server.middlewares.use('/api/update-data', (req, res) => {
            if (req.method !== 'POST') {
              res.writeHead(405);
              return res.end();
            }
            let body = '';
            req.on('data', c => { body += c; });
            req.on('end', () => {
              const { source } = JSON.parse(body || '{}');
              try {
                execSync(`node scripts/process-data.mjs ${source || 'local'}`, { stdio: 'pipe' });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, timestamp: new Date().toISOString() }));
              } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.stderr?.toString() || e.message }));
              }
            });
          });
        },
      },
    ],
    server: {
      proxy: {
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/anthropic/, ''),
          configure: proxy => {
            proxy.on('proxyReq', proxyReq => {
              if (env.VITE_ANTHROPIC_API_KEY) {
                proxyReq.setHeader('x-api-key', env.VITE_ANTHROPIC_API_KEY);
              }
              proxyReq.setHeader('anthropic-version', '2023-06-01');
            });
          },
        },
      },
    },
  };
});
