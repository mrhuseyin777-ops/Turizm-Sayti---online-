// ESLint (flat config). Server: Node + CommonJS; brauzer: public/js — adi <script> faylları (modul yox).
// Prettier/formatlama qaydaları qəsdən yoxdur — yalnız səhv tutan qaydalar.
const fs = require('fs');
const path = require('path');
const js = require('@eslint/js');
const globals = require('globals');

// public/js/common.js-in yuxarı səviyyə elanları (const/let/function) digər səhifə skriptlərində qlobal kimi
// istifadə olunur (HTML-də common.js əvvəl yüklənir). Siyahı fayldan avtomatik çıxarılır ki, yeni köməkçi
// əlavə olunanda konfiqurasiya əl ilə yenilənməsin. Şərt: yuxarı səviyyə elan sətirin əvvəlindən başlayır.
function topLevelNames(file) {
  const src = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const re = /^(?:const|let|var|(?:async\s+)?function\*?)\s+([A-Za-z_$][\w$]*)/gm;
  const out = {};
  for (const m of src.matchAll(re)) out[m[1]] = 'readonly';
  return out;
}
const commonGlobals = topLevelNames('public/js/common.js');
// common.js-də yenidən təyin olunan dəyişənlər (setLang → LANG, setCsrf → B2B_CSRF)
for (const k of ['LANG', 'B2B_CSRF']) if (k in commonGlobals) commonGlobals[k] = 'writable';

const sharedRules = {
  'no-unused-vars': ['error', {
    vars: 'all',
    args: 'after-used',
    argsIgnorePattern: '^_',
    caughtErrors: 'none',
    ignoreRestSiblings: true,
  }],
  'no-undef': 'error',
  eqeqeq: ['error', 'smart'],
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
};

module.exports = [
  { ignores: ['node_modules/**', 'data/**', 'backups/**', '.claude/**', 'coverage/**'] },
  js.configs.recommended,
  // ---------------------------------------------------------------- Server, skriptlər, testlər (Node, CommonJS)
  {
    files: ['**/*.js'],
    ignores: ['public/**'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: sharedRules,
  },
  {
    // E2E: page.evaluate / addInitScript daxilindəki kod brauzerdə icra olunur
    files: ['test/e2e/**/*.js'],
    languageOptions: { globals: { ...globals.browser } },
  },
  // ---------------------------------------------------------------- Brauzer (public/js, adi script)
  {
    files: ['public/js/**/*.js'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'script', globals: { ...globals.browser } },
    rules: {
      ...sharedRules,
      // Yuxarı səviyyə elanlar başqa skriptlərin qlobalıdır — yalnız funksiya daxilindəki istifadəsizlər yoxlanılır
      'no-unused-vars': ['error', { ...sharedRules['no-unused-vars'][1], vars: 'local' }],
    },
  },
  {
    // Səhifə skriptləri common.js-in köməkçilərini qlobal kimi istifadə edir (common.js özü istisna —
    // öz elanlarını "qlobalın təkrar elanı" kimi görməsin)
    files: ['public/js/**/*.js'],
    ignores: ['public/js/common.js'],
    languageOptions: { globals: commonGlobals },
  },
  {
    // b2b.js "Müraciətlər"/"Ayarlar" bölməsini public/js/b2b-leads.js-dən (əvvəl yüklənir) çağırır
    files: ['public/js/b2b.js'],
    languageOptions: { globals: { B2BLeads: 'readonly' } },
  },
  {
    // hotel-art.js həm brauzerdə, həm Node testlərində yüklənir (typeof module yoxlaması ilə export)
    files: ['public/js/hotel-art.js'],
    languageOptions: { globals: { module: 'readonly' } },
  },
];
