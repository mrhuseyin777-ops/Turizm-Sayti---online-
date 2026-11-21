// SEO: GET /robots.txt və GET /sitemap.xml (src/routes/*.js avtomatik qoşulur).
//
// Sitemap mütləq URL tələb edir. Host başlığına ETİBAR EDİLMİR (saxtalaşdırıla bilər → sitemap-a
// və robots.txt-ə başqasının domeni düşə bilər). Domen yalnız env PUBLIC_BASE_URL-dən götürülür
// (məs. https://odiola.az). Təyin olunmayıbsa və ya düzgün deyilsə: /sitemap.xml → 404,
// robots.txt-də "Sitemap:" sətiri olmur. Dəyər hər sorğuda oxunur (testlərdə dəyişdirmək üçün).
const express = require('express');

const router = express.Router();

// Axtarış sistemlərinə açıq səhifələr (B2B, paylaşılan seçim linkləri, demo səhifə və API daxil deyil)
const PUBLIC_PAGES = ['/', '/flights.html', '/cars.html', '/how.html', '/privacy.html', '/terms.html'];
const DISALLOW = ['/api/', '/b2b', '/s/', '/s.html', '/gallery-demo.html'];

function publicBaseUrl() {
  const raw = (process.env.PUBLIC_BASE_URL || '').trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || u.search || u.hash) return null;
    return (u.origin + u.pathname).replace(/\/+$/, '');
  } catch {
    return null;
  }
}

const xmlEsc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

router.get('/robots.txt', (req, res) => {
  const base = publicBaseUrl();
  const lines = ['User-agent: *', 'Allow: /', ...DISALLOW.map((p) => `Disallow: ${p}`)];
  if (base) lines.push('', `Sitemap: ${base}/sitemap.xml`);
  res.type('text/plain; charset=utf-8').set('Cache-Control', 'public, max-age=3600').send(lines.join('\n') + '\n');
});

router.get('/sitemap.xml', (req, res, next) => {
  const base = publicBaseUrl();
  if (!base) return next(); // → mərkəzləşdirilmiş 404
  const urls = PUBLIC_PAGES.map((p) => `  <url><loc>${xmlEsc(base + p)}</loc></url>`).join('\n');
  res.type('application/xml; charset=utf-8').set('Cache-Control', 'public, max-age=3600')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

module.exports = router;
module.exports.publicBaseUrl = publicBaseUrl;
module.exports.PUBLIC_PAGES = PUBLIC_PAGES;
