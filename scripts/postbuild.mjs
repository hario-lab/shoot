// Remove type="module" from dist/index.html so it opens via file:// without CORS errors
import { readFileSync, writeFileSync } from 'fs';

const path = 'dist/index.html';
const html = readFileSync(path, 'utf8');
const fixed = html.replace(/<script[^>]*type="module"[^>]*>/g, '<script>');
writeFileSync(path, fixed);

const remaining = (fixed.match(/type="module"/g) || []).length;
console.log(`[postbuild] type="module" removed. Remaining: ${remaining} → dist/index.html is file://-compatible`);
