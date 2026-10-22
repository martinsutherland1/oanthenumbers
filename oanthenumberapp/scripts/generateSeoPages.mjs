// Post-build step: gives every league its own crawlable URL (dist/epl/index.html, ...) with
// that league's title, description and canonical, and writes sitemap.xml. The app is a
// single-page React app, so without this Google would only ever see one page.
//
//   node scripts/generateSeoPages.mjs   (run by `npm run build`)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const seo = JSON.parse(readFileSync(join(root, 'src/seoPages.json'), 'utf8'));
const template = readFileSync(join(dist, 'index.html'), 'utf8');

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function render({ title, description }, path) {
  const url = seo.siteUrl + path;
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(description)}$2`);
}

const paths = ['/'];
Object.values(seo.leagues).filter(league => !league.disabled).forEach(league => {
  const dir = join(dist, league.path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), render(league, league.path));
  paths.push(league.path);
});

const today = new Date().toISOString().slice(0, 10);
const urls = paths.map(p => `  <url><loc>${seo.siteUrl}${p}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>${p === '/' ? '1.0' : '0.8'}</priority></url>`);
writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
console.log(`SEO: wrote ${paths.length - 1} league pages and sitemap.xml`);
