# Odiola — tur və otel müqayisə platforması

Azərbaycandakı tur operatorlarının (Summer Tour, Funsun, Kompas və s.) tur və otel
qiymətlərini bir axtarışda toplayıb **ən ucuzdan bahalıya** düzən platforma. İki hissə var:

- **B2C** (`/`) — müştəri istiqamət, tarix və büdcə seçir, bütün operatorların təklifləri müqayisə olunur.
- **B2B** (`/b2b`) — tur menecerləri üçün: otel × operator matrisi, komissiya hesabı, müştəriyə hazır təklif mətni, CSV.

> ⚠️ Hazırda qiymətlər **demo məlumatdır**. Real operator inteqrasiyası üçün bax: [`docs/PLAN.md`](docs/PLAN.md).

## İşə salmaq

Tələb: **Node.js 22.12+**.

```bash
npm ci           # package-lock.json-dakı dəqiq versiyalar
npm start        # http://localhost:3000
npm test         # bütün testlər (təhlükəsizlik testləri daxil: test/security.test.js)
npm audit        # asılılıqlarda məlum zəiflik yoxlaması
```

### Verilənlər bazası (PostgreSQL)

`DATABASE_URL` təyin olunanda bütün daimi məlumat (agentliklər, istifadəçilər, sessiyalar, müraciətlər, seçim linkləri,
aviabilet izləmələri, avia/avto müraciətləri) PostgreSQL-də saxlanılır; miqrasiyalar server açılışında avtomatik
tətbiq olunur. `DATABASE_URL` yoxdursa — dev/test üçün fayl/yaddaş rejimi (məlumat yenidən başlamada itir).

```bash
DATABASE_URL=postgres://... npm run migrate        # miqrasiyalar (açılışda da avtomatik); --status
DATABASE_URL=postgres://... npm run backup         # pg_dump ilə sıxılmış backup → ./backups
DATABASE_URL=postgres://... npm run restore -- backups/<fayl>.dump   # TƏHLÜKƏLİ: təsdiq tələb edir
TEST_DATABASE_URL=postgres://.../odiola_test npm test   # + real Postgres üzərində test/db.test.js
```

Backup strategiyası, bərpa, data retention (`DATA_RETENTION_DAYS`, default 180 gün) və sirlərin idarəsi:
[`docs/OPERATIONS.md`](docs/OPERATIONS.md).

Konfiqurasiya mühit dəyişənlərindən oxunur — siyahı və izahlar: [`.env.example`](.env.example)
(`PORT`, `NODE_ENV`, `TRUST_PROXY`, `ALLOWED_ORIGINS`, `TURTAP_DATA_DIR`, sessiya müddətləri və s.).
Repoda heç bir parol və ya sirr saxlanılmır.

### B2B agentlik hesabı yaratmaq

`/b2b` paneli və agent rejimi (aviabilet, avtomobil) yalnız hesabla işləyir. İlk hesabı yaradın:

```bash
npm run create-agency -- --agency "Demo Travel" --user aysel --name "Aysel Məmmədova"
# parol interaktiv soruşulur (ekranda görünmür, min. 12 simvol)

# eyni agentliyə ikinci menecer:
npm run create-agency -- --agency "Demo Travel" --user murad --name "Murad" --role manager
# parolu dəyişmək (köhnə sessiyalar bağlanır):
npm run create-agency -- --user aysel --reset-password
npm run create-agency -- --list
```

Avtomatlaşdırma üçün parol `TURTAP_PASSWORD` mühit dəyişəni ilə verilə bilər (komanda arqumenti kimi yox).
Hesablar `DATABASE_URL` varsa PostgreSQL-də, yoxdursa `data/accounts.json`-da saxlanılır (scrypt hash; `data/` git-ə düşmür).

Yalnız lokal inkişaf üçün (production-da işləmir) yaddaşda demo hesab:

```bash
B2B_DEMO_USER=demo B2B_DEMO_PASSWORD='öz-lokal-parolunuz-12+' npm start
```

### Müraciət bildirişləri (Telegram) və CRM

Yeni müraciətlər Telegram-a (və istəyə görə e-poçta) gəlir; B2B → Müraciətlər-də status (yeni / işdə / satıldı / ləğv)
və menecer qeydi saxlanılır. Qısaca: @BotFather ilə bot yaradın → tokeni hostinqdə `TELEGRAM_BOT_TOKEN` kimi yazın →
botu agentlik qrupuna əlavə edin → chat_id-ni tapın (`getUpdates` və ya @userinfobot) → B2B → **Ayarlar** →
«Test mesajı göndər» → «Yadda saxla». Ətraflı: [`docs/OPERATIONS.md` §9](docs/OPERATIONS.md).

Təhlükəsizlik modeli, tətbiq olunan qorunmalar və production üçün qalan addımlar: [`SECURITY.md`](SECURITY.md).

## Keyfiyyət və CI

```bash
npm run lint       # ESLint (eslint.config.js): server — Node/CommonJS, brauzer — public/js (adi script)
npm test           # bütün unit/inteqrasiya testləri (yaddaş rejimi; DB testləri TEST_DATABASE_URL olmadan skip)
npm run check      # lint + test (commit/PR-dan əvvəl)
TEST_DATABASE_URL=postgres://user:pass@127.0.0.1:5432/odiola_test npm run test:db   # yalnız test/db.test.js (real Postgres)
npm run test:e2e   # E2E: Playwright + Chromium (aşağıya bax)
```

- **Lint**: `@eslint/js` tövsiyə olunan qaydalar + `no-unused-vars` (`_` prefiksli arqumentlər istisna), `no-undef`,
  `eqeqeq` (smart), `no-eval`, `no-implied-eval`, `no-new-func`. Formatlama qaydası (Prettier) yoxdur. `public/js/common.js`-in
  yuxarı səviyyə köməkçiləri digər səhifə skriptləri üçün qlobal kimi avtomatik elan olunur.
- **DB testləri**: `TEST_DATABASE_URL`-ə **yalnız test bazası** verin — hər işə salınma ayrıca müvəqqəti sxem yaradıb sonda silir.
- **E2E** (`test/e2e/*.spec.js`): Playwright-ın öz runner-i yox, `node:test` + `require('playwright')`. Playwright layihənin
  asılılığı deyil: mühitdə varsa işləyir (`NODE_PATH`-də və ya `npm install --no-save playwright@1.63.0` +
  `npx playwright install chromium`), yoxdursa testlər skip olunur. Server təsadüfi portda, yaddaş rejimində və müvəqqəti demo
  B2B hesabı ilə açılır; ana səhifə axtarışı, aviabilet, avtomobil, B2B giriş → axtarış, how/privacy/terms yoxlanılır —
  hər səhifədə konsol/JS xətası, CSP pozuntusu, brauzer xətası bildirişi və 390px-də üfüqi scroll olmamalıdır.
- **CI** (`.github/workflows/ci.yml`, hər push və PR): `test` — `npm ci`, lint, test, `npm audit --omit=dev --audit-level=high`;
  `test-db` — `postgres:16` service konteyneri ilə `npm test` (DB testləri daxil); `e2e` — Chromium ilə `npm run test:e2e`.
  `permissions: contents: read`, köhnə işlər `concurrency` ilə ləğv olunur, npm cache.
- **Monitorinq**: strukturlaşdırılmış loglar (`LOG_LEVEL`, production-da JSON), `X-Request-Id`, ixtiyari Sentry (`SENTRY_DSN`),
  brauzer xətaları (`/api/client-errors`), `GET /healthz` və `GET /readyz` — bax [`docs/OPERATIONS.md`](docs/OPERATIONS.md) → 8.

## Struktur

```
server.js                 Express server: təhlükəsizlik qatı, API (/api/search, /api/suggest), 404/xəta handler
src/env.js                Mühit konfiqurasiyası (env)
src/security/             Başlıqlar/CSP, rate limit, Origin (CSRF), body/query yoxlaması, log maskalanması
src/observability/        Strukturlaşdırılmış logger, request id / sorğu logu, ixtiyari Sentry
src/auth/                 B2B hesablar (scrypt), sessiyalar, brute-force qorunması
src/storage/              Saxlama qatı: vahid repository interfeysi — postgres.js (DATABASE_URL) və memory.js (fayl/yaddaş),
                          cleanup.js (data retention)
src/db/                   PostgreSQL bağlantı hovuzu və miqrasiya icraçısı (advisory lock)
migrations/               Nömrələnmiş, idempotent SQL miqrasiyaları
scripts/create-agency.js  Agentlik/istifadəçi yaratmaq (npm run create-agency)
scripts/migrate.js, backup.js, restore.js   npm run migrate / backup / restore
src/config.js             Brend adı, valyuta məzənnələri
src/search.js             Axtarış: operatorları paralel sorğulayır, filtr, qruplaşdırma, sıralama
src/providers/            Hər operator üçün adapter (indi demo; real API ilə əvəz olunacaq)
src/data/catalog.js       Demo istiqamətlər, otellər, turlar
public/                   B2C və B2B interfeysi
docs/PLAN.md              Ad təklifləri, inteqrasiya planı, əlavə ideyalar
```

## Yeni operator əlavə etmək

`src/providers/` daxilində `search(query)` funksiyası olan modul yaradın — o, `Offer[]` qaytarmalıdır
(sahələr üçün `mockProvider.js`-ə baxın) — və onu `src/providers/index.js`-də qeyd edin.
Qalan hər şey (müqayisə, sıralama, B2B matrisi) avtomatik işləyir.

## İnternetə yerləşdirmə (Render.com)

Daimi saxlama üçün PostgreSQL lazımdır (pulsuz hostinqdə disk müvəqqətidir). Üç variant:

### A) Blueprint (tövsiyə olunur)

1. render.com-da GitHub hesabı ilə qeydiyyatdan keçin → **New → Blueprint** → bu repo.
2. Render repodakı [`render.yaml`](render.yaml)-ı oxuyur və iki resurs yaradır: **odiola** (Web Service) və
   **odiola-db** (PostgreSQL). `DATABASE_URL` web servisə avtomatik bağlanır (`fromDatabase`), `IP_HASH_SECRET`
   təsadüfi yaradılır.
3. Soruşulan gizli dəyərləri daxil edin:
   - `B2B_ADMIN_USER` = admin istifadəçi adı (3–32 simvol: hərf, rəqəm, `. _ -`)
   - `B2B_ADMIN_PASSWORD` = güclü parol (min. 12 simvol) — yalnız Render-də saxlanılır, repoda yox
4. Deploy bitəndə sayt `https://<ad>.onrender.com` ünvanında açılır; B2B: `/b2b`. Açılış logunda
   `[storage] PostgreSQL hazırdır` görünməlidir.

Pulsuz Postgres planının məhdudiyyətləri (yaşama müddəti, həcm, backup) dəyişə bilər — Render sənədində yoxlayın.

### B) Əl ilə: Web Service + Postgres

1. **New → PostgreSQL** → ad (məs. `odiola-db`), region (web servislə **eyni** region), plan. Yaradıldıqdan sonra
   **Internal Database URL**-i kopyalayın.
2. **New → Web Service** → bu repo. Runtime **Node**, Build Command `npm ci --omit=dev`, Start Command `node server.js`.
3. **Environment** bölməsində:
   - `NODE_ENV` = `production`, `TRUST_PROXY` = `1`
   - `DATABASE_URL` = 1-ci addımdakı daxili URL (daxili şəbəkədə `DATABASE_SSL` lazım deyil)
   - `IP_HASH_SECRET` = uzun təsadüfi dəyər
   - `B2B_ADMIN_USER`, `B2B_ADMIN_PASSWORD`, `B2B_ADMIN_AGENCY` (məs. `Odiola`)
   - `PUBLIC_BASE_URL` = saytın ictimai ünvanı (məs. `https://odiola.az`) — domen alınanda əlavə edin:
     bu olmadan `/sitemap.xml` 404 qaytarır və `robots.txt`-də `Sitemap:` sətiri olmur (Host başlığına etibar edilmir)
4. Deploy. Miqrasiyalar açılışda avtomatik tətbiq olunur.

### C) İstənilən Postgres provayderi

Hər hansı PostgreSQL (Neon, Supabase, öz serveriniz və s.) işləyir: provayderin verdiyi bağlantı sətrini
`DATABASE_URL`-ə yazın; internet üzərindən bağlantıda `DATABASE_SSL=require` (və ya URL-də `?sslmode=require`).
Pulsuz planlarda bağlantı sayı az ola bilər — `DATABASE_POOL_MAX` (default 5) ilə tənzimləyin.

Qeyd: `DATABASE_URL` olmadan da sayt işləyir, amma müraciətlər, seçim linkləri, sessiyalar və `create-agency` ilə
yaradılan hesablar yenidən başlamada itir (admin hesabı hər dəfə env-dən yenidən yaradılır) — production-da logda
xəbərdarlıq çıxır. Backup və bərpa: [`docs/OPERATIONS.md`](docs/OPERATIONS.md).

## Hüquqi səhifələr və SEO

- `public/privacy.html` (Məxfilik siyasəti) və `public/terms.html` (İstifadə şərtləri) — AZ/EN/RU mətnlər
  `public/js/legal.js`-dədir. **LAYİHƏDİR**: dərc etməzdən əvvəl hüquqşünas yoxlamalı, kvadrat mötərizədəki
  `[ … ]` placeholder-lər (hüquqi ad, ünvan, VÖEN, əlaqə e-poçtu, hostinq provayderi/ölkəsi, saxlama müddətləri,
  tətbiq olunan hüquq və məhkəmə) doldurulmalıdır. Mətn dəyişəndə "Son yenilənmə" tarixini (`lg_updated`) yeniləyin.
- Bütün müraciət formalarında "Göndərməklə Məxfilik siyasəti ilə tanış olduğunuzu təsdiqləyirsiniz" mətni (`consentHtml()`, common.js).
- `GET /robots.txt` və `GET /sitemap.xml` — `src/routes/seo.js` (sitemap yalnız `PUBLIC_BASE_URL` ilə).
