# Odiola — əməliyyatlar: verilənlər bazası, backup, bərpa, data retention, sirlər, monitorinq

Bu sənəd Odiola-ı production-da işlədən şəxs üçündür. Təhlükəsizlik modeli: [`SECURITY.md`](../SECURITY.md).

> Hostinq provayderlərinin (Render, Neon və s.) plan şərtləri — backup müddəti, PITR, pulsuz planın limitləri,
> disk şifrələməsi — tez-tez dəyişir. Bu sənəd onları **təxmin etmir**: hər bəndi provayderin cari sənədində yoxlayın.

## 1. Saxlama rejimləri

| Rejim | Nə vaxt | Harada saxlanılır | Yenidən başlamada |
|---|---|---|---|
| **PostgreSQL** | `DATABASE_URL` təyin olunub | `agencies`, `users`, `sessions`, `selections`, `leads`, `flight_alerts`, `flight_requests`, `car_requests` | qalır; bir neçə server nüsxəsi ilə işləyir |
| **Fayl/yaddaş** | `DATABASE_URL` yoxdur (dev/test) | hesablar və izləmələr `data/*.json`, qalanı proses yaddaşında | yaddaşdakılar itir |

Production-da `DATABASE_URL` yoxdursa sayt açılır, amma logda açıq xəbərdarlıq çıxır:
`[storage] XƏBƏRDARLIQ: DATABASE_URL təyin olunmayıb ...`. Bunu görürsünüzsə, DB-ni qoşun.

Rate limit və brute-force sayğacları hər iki rejimdə qəsdən yaddaşdadır (bax SECURITY.md §3).

### Mühit dəyişənləri

| Dəyişən | Default | İzah |
|---|---|---|
| `DATABASE_URL` | — | `postgres://istifadəçi:parol@host:port/baza`. Yalnız hostinq panelində / secret manager-də. |
| `DATABASE_SSL` | `disable` | `require` — TLS + sertifikat yoxlaması; `no-verify` — TLS, yoxlamasız (zəif); `disable` — daxili şəbəkə. URL-dəki `?sslmode=` üstündür. |
| `DATABASE_POOL_MAX` | `5` | Bir nüsxənin maks. bağlantı sayı. Provayderin bağlantı limitinə görə seçin (nüsxə sayı × bu dəyər). |
| `DATA_RETENTION_DAYS` | `180` | Leadlər və avia/avto müraciətləri neçə gün saxlanılır. |
| `DATA_CLEANUP` | (açıq) | `0` — dövri təmizləməni söndür; `1` — test rejimində də işə sal. |
| `DATA_CLEANUP_INTERVAL_MINUTES` | `60` | Təmizləmə intervalı. |
| `IP_HASH_SECRET` | — | IP hash-i üçün HMAC açarı (tövsiyə olunur). |
| `BACKUP_DIR`, `BACKUP_KEEP` | `./backups`, hamısı | `npm run backup` üçün qovluq və saxlanılan fayl sayı. |

## 2. Miqrasiyalar

- Fayllar: `migrations/NNN_ad.sql` (nömrə sırası ilə). Hər fayl öz tranzaksiyasında tətbiq olunur və
  `schema_migrations` cədvəlində (versiya, ad, SHA-256 checksum, tarix) qeyd edilir.
- **Avtomatik**: server açılanda (`node server.js`) — `pg_advisory_lock` altında. Bir neçə nüsxə eyni anda açılsa,
  biri miqrasiya edir, digərləri gözləyir və artıq tətbiq olunanları ötürür. Miqrasiya alınmasa server açılmır
  (exit 1) — hostinq prosesi yenidən başladacaq; logda səbəb yazılır.
- **Əl ilə**: `npm run migrate` (tətbiq et), `npm run migrate -- --status` (vəziyyət).
- Qaydalar:
  - Tətbiq olunmuş faylı **dəyişməyin** — checksum fərqli olsa server xəta verir. Dəyişiklik = yeni fayl
    (`002_...sql`).
  - Faylları idempotent yazın (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).
  - Böyük cədvəllərdə uzun kilid yaradan dəyişikliklərdən (məs. `NOT NULL` sütunu default-suz əlavə etmək) qaçın;
    lazım olsa mərhələli edin.
  - Miqrasiyadan əvvəl backup götürün (§4).

## 3. Data retention (şəxsi məlumatların saxlanma müddəti)

`src/storage/cleanup.js` server açılanda və sonra hər `DATA_CLEANUP_INTERVAL_MINUTES` dəqiqədən bir işləyir:

| Məlumat | Silinmə qaydası |
|---|---|
| Leadlər (müraciətlər, geri zəng, seçim linkindən gələn) | `DATA_RETENTION_DAYS` gündən köhnə |
| Aviabilet sifariş müraciətləri, avtomobil müraciətləri | `DATA_RETENTION_DAYS` gündən köhnə |
| B2B seçim linkləri | 30 gündən köhnə (ona bağlı lead qalır, `selection_id` boşalır) |
| Qiymət izləmələri | gediş tarixi keçmiş |
| Sessiyalar | mütləq (default 12 saat) və ya hərəkətsizlik (default 2 saat) müddəti bitmiş |

- IP heç yerdə açıq saxlanılmır — yalnız hash (`flight_requests.ip_hash`, `flight_alerts.ip_key`).
- Bir neçə nüsxədə təmizləmə hər nüsxədə işləyir; `DELETE` əməliyyatları idempotentdir.
- **Diqqət**: silinmiş məlumat backup fayllarında backup saxlanma müddəti qədər qalır. Backup saxlanma müddətini
  (provayder + öz dump-larınız) retention siyasətinə uyğun seçin və məxfilik siyasətində göstərin.
- Saxlama müddətinin hüquqi tələblərə uyğunluğunu hüquqşünasla yoxlayın (SECURITY.md §4.9).

## 4. Backup strategiyası

Tövsiyə olunan iki qat:

1. **Provayderin avtomatik backup / PITR (point-in-time recovery) imkanı.** Bəzi provayderlər gündəlik snapshot və
   ya müəyyən müddət ərzində istənilən ana bərpa təklif edir, bəzi pulsuz planlarda isə backup ümumiyyətlə olmaya
   bilər. Planınızda nə olduğunu, saxlama müddətini və bərpanın necə edildiyini **provayderin sənədində yoxlayın**
   (Render üçün: render.com/docs → Postgres; başqa provayder üçün onun sənədi).
2. **Öz məntiqi dump-larınız** (`npm run backup`) — provayderdən asılı olmayan, başqa yerdə saxlanılan nüsxə.

### `npm run backup`

```bash
DATABASE_URL=postgres://... BACKUP_DIR=/secure/odiola-backups BACKUP_KEEP=14 npm run backup
```

- `pg_dump --format=custom --compress=6 --no-owner --no-privileges` — sıxılmış, `pg_restore` ilə bərpa olunan fayl.
- Ad: `odiola-<baza>-<YYYYMMDDTHHMMSSZ>.dump` (UTC). Fayl `0600`, qovluq `0700` icazə ilə; yarımçıq dump silinir.
- Parol komanda sətrində görünmür (`DATABASE_URL` libpq mühit dəyişənlərinə çevrilir).
- `pg_dump` lazımdır (PostgreSQL klient alətləri, versiyası serverinkindən köhnə olmamalıdır). Yoxdursa skript aydın
  xəta verir: Debian/Ubuntu — `apt-get install postgresql-client`, macOS — `brew install libpq`.
- `BACKUP_KEEP=N` — həmin bazanın ən yeni N faylı qalır.

### Harada və necə saxlamalı

- Dump-da **şəxsi məlumat** (ad, telefon, e-poçt) və parol hash-ləri var. Repoya, paylaşılan qovluğa, e-poçta qoymayın.
- Şifrələyin (məs. `age` və ya `gpg` ilə) və serverdən **ayrı** yerdə saxlayın (başqa hesab/region). Şifrələmə açarını
  backup-la eyni yerdə saxlamayın.
- Tezlik: ən azı gündəlik (cron, CI planlı işi və ya ayrıca server). Render daxili bazası `ipAllowList: []` ilə
  internetdən bağlıdır — kənardan dump üçün ya müvəqqəti öz IP-nizi icazəyə əlavə edin, ya da dump-ı Render daxilindən
  (məs. ayrıca cron servis) işə salın. Mövcud imkanları Render sənədində yoxlayın.
- Ayda bir dəfə **bərpanı sınayın** (§5) — sınanmamış backup backup deyil.

## 5. Bərpa (restore)

> ⚠️ **Təhlükəli əməliyyat.** `--clean` rejimində hədəf bazadakı cədvəllər dump-dakı vəziyyətlə əvəz olunur;
> dump-dan sonrakı bütün məlumat (yeni leadlər, hesablar, sessiyalar) itir.

Addımlar:

1. **Hədəfi dəqiqləşdirin.** İlk növbədə boş/test bazasına bərpa edib yoxlamaq tövsiyə olunur.
2. **Cari vəziyyətin backup-ını götürün**: `npm run backup` (səhv olsa geri qayıtmaq üçün).
3. **Tətbiqi dayandırın** və ya texniki xidmət rejiminə keçirin (yazılar bərpa ilə toqquşmasın).
4. Bərpa:
   ```bash
   DATABASE_URL=postgres://... npm run restore -- /secure/odiola-backups/odiola-odiola-20261121T101500Z.dump
   # interaktiv terminal baza adını yazmağı tələb edir; avtomatlaşdırmada:
   DATABASE_URL=postgres://... npm run restore -- <fayl> --confirm <baza_adı>
   ```
   Skript `pg_restore --clean --if-exists --single-transaction --exit-on-error` işlədir: xəta olsa heç nə dəyişmir.
5. **Tətbiqi başladın** — açılışda miqrasiyalar yoxlanılır (dump köhnə sxemdədirsə, yeni miqrasiyalar tətbiq olunur).
6. **Yoxlayın**: `/api/config` 200, B2B girişi, son leadlər görünür; logda xəta yoxdur.
7. Bərpadan sonra bütün istifadəçilər yenidən daxil olmalı ola bilər (sessiyalar dump anındakı vəziyyətdədir).

Provayderin PITR/snapshot bərpası adətən **yeni** baza yaradır — sonra `DATABASE_URL`-i yeni bazaya dəyişib tətbiqi
yenidən başlatmaq lazımdır. Dəqiq addımlar provayderin sənədindədir.

## 6. Sirlərin idarəsi

- `DATABASE_URL`, `B2B_ADMIN_PASSWORD`, `IP_HASH_SECRET`, operator API açarları **yalnız** hostinq panelində
  (Render: Environment / `sync: false` / `fromDatabase` / `generateValue`) və ya secret manager-də saxlanılır.
  Repoya, `.env.example`-ə, loglara, issue/PR mətnlərinə yazılmır. `.env*`, `data/`, `backups/`, `*.dump` `.gitignore`-dadır.
- Lokal işdə `DATABASE_URL`-i shell tarixçəsinə düşməyən üsulla verin (məs. `read -s` və ya parol meneceri CLI).
  `node --test` altında `DATABASE_URL` nəzərə alınmır (testlər real bazanı çirkləndirməsin); test üçün ayrıca
  `TEST_DATABASE_URL` (yalnız test bazası!) istifadə olunur — `test/db.test.js` müvəqqəti sxem yaradıb sonda silir.
- **Rotasiya**: DB parolunu provayder panelində dəyişin → yeni `DATABASE_URL`-i env-də yeniləyin → tətbiqi yenidən
  başladın. Sızma şübhəsində: DB parolunu dəyişin, `sessions` cədvəlini təmizləyin (`DELETE FROM sessions;` — hamı
  yenidən daxil olur), admin parollarını (`npm run create-agency -- --user <ad> --reset-password`) dəyişin.
- `B2B_ADMIN_PASSWORD`: DB rejimində env-dəki parol DB-dəkindən fərqlidirsə açılışda env-ə görə yenilənir. Parolu
  dəyişmək üçün env-i dəyişib tətbiqi yenidən başladın; env-i yalnız etibarlı şəxslər görməlidir.
- `IP_HASH_SECRET`-i dəyişmək köhnə hash-lərlə uyğunluğu pozur (yalnız IP üzrə limit sayğacları sıfırlanır) — təhlükəsizdir.
- DB-yə şəbəkə çıxışını məhdudlaşdırın (Render: `ipAllowList`), xarici bağlantıda `DATABASE_SSL=require`.

## 7. Hesablar (CLI)

`npm run create-agency` həm DB, həm fayl rejimində işləyir (`DATABASE_URL`-ə görə). DB rejimində əvvəlcə miqrasiyalar
yoxlanılır. Parol interaktiv və ya `TURTAP_PASSWORD` env ilə; `--reset-password` istifadəçinin bütün DB sessiyalarını
silir. Bax README → "B2B agentlik hesabı yaratmaq".

## 8. Monitorinq, loglar və health check

### Health check

| Yol | Məna | Uğurlu | Uğursuz |
|---|---|---|---|
| `GET /healthz` | Proses canlıdır (liveness) | `200 {"status":"ok"}` | cavab yoxdur |
| `GET /readyz` | Sorğu qəbul etməyə hazırdır (readiness): miqrasiyalar bitib, DB rejimində `SELECT 1` ≤ 2 s | `200 {"status":"ok"}` | `503 {"status":"unavailable"}` |

Render-də `healthCheckPath: /readyz` (render.yaml). Kubernetes/Docker: liveness → `/healthz`, readiness → `/readyz`.
Cavabda daxili detal yoxdur — səbəbi loglarda axtarın (`[readyz] DB yoxlaması alınmadı`, `[db] hovuz xətası`).

### Loglar

- Production (`NODE_ENV=production`) default olaraq JSON: sətir başına bir obyekt
  `{"time":"…","level":"info","msg":"request","requestId":"…","method":"GET","path":"/api/search","status":200,"durationMs":41.2}`.
  Dev-də oxunaqlı format. `LOG_FORMAT=json|pretty` ilə dəyişdirilir; `LOG_LEVEL=debug|info|warn|error|silent` (default `info`).
- `warn`/`error` → stderr, qalanı → stdout. Hostinq log axtarışında `requestId` ilə bir sorğunun bütün loglarını tapın —
  istifadəçi dəstəyə müraciət edəndə cavab başlığındakı `X-Request-Id` dəyərini soruşun.
- Əsas hadisələr: `request` (yalnız `/api/*`), `unhandled error` (5xx, stack ilə), `client error` (brauzer xətası),
  `[storage] …`, `[db] hovuz xətası`, `[cleanup] …`, `[process] tutulmamış xəta`.
- Loglarda şəxsi məlumat maskalanır (SECURITY.md → 2.7.1). Yenə də log saxlama müddətini hostinq panelində məhdudlaşdırın
  (tövsiyə: ≤ 30 gün) və log girişini yalnız etibarlı şəxslərə verin.

### Sentry (ixtiyari)

1. sentry.io-da (və ya öz Sentry serverinizdə) Node.js layihəsi yaradın, DSN-i kopyalayın.
2. Hostinq panelində `SENTRY_DSN=<dsn>` (gizli dəyər kimi; repoya YAZMAYIN), istəyə görə `SENTRY_ENVIRONMENT=production`.
3. Yenidən başladın: açılış logunda `"sentry":true` görünməlidir. DSN boş olanda Sentry kodu yüklənmir və şəbəkə sorğusu getmir.

Yalnız server 5xx xətaları (metod, yol şablonu, request id ilə) və başlanğıc xətası göndərilir; cookie, başlıqlar, body,
query, IP, istifadəçi göndərilmir. Sentry layihəsində "Data Scrubber" və "IP adreslərini saxlama" seçimlərini də aktiv edin.

### Brauzer xətaları

Səhifələrdəki JS xətaları `client error` (səviyyə `warn`) kimi server loguna düşür: `kind`, `message`, `file`
(`/js/*.js` və ya `external`), `line`, `col`, `page` (query-siz). Çoxlu eyni xəta = son deploy-da regressiya ola bilər.

