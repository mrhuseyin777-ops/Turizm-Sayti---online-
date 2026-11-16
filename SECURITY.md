# TurTap — təhlükəsizlik

Bu sənəd TurTap-ın təhdid modelini, kodda tətbiq olunan qorunmaları, production-a çıxmazdan əvvəl
görülməli işləri və zəiflik bildirmə qaydasını təsvir edir. Son audit: 2026-11 (OWASP Top 10 2021 /
ASVS 4.0 əsasında).

> Qısa xülasə: kod səviyyəsində əsas qorunmalar tətbiq olunub, amma **sayt hələ production üçün hazır
> deyil** — real verilənlər bazası, HTTPS, sirlərin idarəsi, backup və monitorinq qurulmalıdır
> (aşağıda "Production üçün qalan addımlar").

## 1. Təhdid modeli

### Qorunan aktivlər

| Aktiv | Harada | Niyə vacibdir |
|---|---|---|
| Müştəri şəxsi məlumatları (ad, telefon, e-poçt, qeyd) | müraciətlər (leads, avia/avto sifariş müraciətləri) | şəxsi məlumat; sızma — hüquqi və reputasiya riski |
| Agentlik hesabları (istifadəçi adı, parol hash-i) | `data/accounts.json` | hesab ələ keçirilsə — leadlər və müştəri bazası oğurlanır |
| Agentliyin leadləri və net qiymətləri, komissiyası | B2B API, seçim linkləri | kommersiya sirri, rəqabət |
| Qiymətin düzgünlüyü | seçim linkləri, sifariş müraciətləri | qiymət manipulyasiyası — maliyyə itkisi |
| Gələcəkdə: ödəniş məlumatı | — (hələ yoxdur) | PCI DSS — bax §4.7 |

### Təhdid aktorları

- **Anonim internet istifadəçisi / bot** — spam müraciətlər, axtarış API-sinin istismarı (DoS, scraping),
  XSS cəhdləri, brute-force.
- **Rəqib agentlik / başqa agentliyin istifadəçisi** — başqasının leadlərinə baxmaq (IDOR), qiymətləri saxtalaşdırmaq.
- **Paylaşılan linki alan üçüncü şəxs** — link vasitəsilə daxili məlumata (operator adı, net qiymət) çıxış.
- **Zərərli sayt (CSRF / clickjacking)** — daxil olmuş menecerin brauzeri ilə onun adından əməliyyat.
- **Serverə/backup-a giriş əldə etmiş hücumçu** — hesab faylının oğurlanması.

### Etibar sərhədləri

Brauzer (etibarsız) → [Cloudflare/WAF — planlaşdırılır] → reverse proxy (TLS) → Node/Express → yaddaş + `data/` fayl.
Brauzerdən gələn **heç bir** dəyərə (qiymət, agentlik adı, rol, `localStorage`) etibar edilmir.

## 2. Tətbiq olunan qorunmalar

### 2.1 HTTP başlıqları (`src/security/http.js`)

- **Content-Security-Policy**: `default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline';
  img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`
  (+ production-da `upgrade-insecure-requests`).
  - Inline `<script>`, inline hadisə atributları (`onclick=`) və `eval` yoxdur — testlə yoxlanılır.
  - `style-src-attr 'unsafe-inline'`: interfeys HTML/JS şablonlarında `style="..."` atributlarından geniş istifadə edir.
    CSS atributu JS icra edə bilmir; qalan risk vizual dəyişiklikdir və bütün dinamik dəyərlər `esc()` ilə escape olunur.
    `<style>` blokları və xarici CSS qadağandır. Gələcək iş: style atributlarını CSS siniflərinə köçürüb bunu da çıxarmaq.
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` + `frame-ancestors 'none'` (clickjacking),
  `Referrer-Policy: strict-origin-when-cross-origin` (`/s/<id>` və `/b2b` üçün `no-referrer` — capability link sızmasın),
  `Permissions-Policy` (kamera, mikrofon, geolokasiya, ödəniş və s. söndürülüb), `Cross-Origin-Opener-Policy: same-origin`,
  `Cross-Origin-Resource-Policy: same-origin`.
- **HSTS** (`max-age=31536000; includeSubDomains`) yalnız `NODE_ENV=production` və HTTPS sorğularında.
- `X-Powered-By` söndürülüb. Bütün `/api/*` cavabları `Cache-Control: no-store` (sessiya/şəxsi məlumat keşə düşmür).
- CORS başlıqları verilmir → başqa saytlar API cavablarını oxuya bilmir.

### 2.2 B2B autentifikasiya (`src/auth/`)

- Agentlik + istifadəçi (rol: `admin` / `manager`) hesabları. Yaradılması: `npm run create-agency` (parol interaktiv,
  ekranda görünmür, və ya `TURTAP_PASSWORD` env; heç vaxt komanda arqumenti kimi).
- **Parol**: `crypto.scrypt` (N=2¹⁵, r=8, p=1, 16 bayt təsadüfi duz, 64 bayt açar), müqayisə `crypto.timingSafeEqual`.
  Parametrlər hash-in içində saxlanılır (gələcəkdə gücləndirilə bilər, girişdə avtomatik rehash).
  Siyasət: min. 12 simvol, yayılmış parollar və istifadəçi adını ehtiva edən parollar rədd edilir.
  Mövcud olmayan istifadəçidə də eyni hesablama aparılır (istifadəçi adlarının sayılmasının qarşısı), cavab eynidir.
- **Sessiya**: 256 bitlik `crypto.randomBytes` id, yalnız `HttpOnly; SameSite=Strict; Path=/` cookie-də
  (production-da `Secure` + `__Host-` prefiksi). Serverdə id-nin SHA-256 hash-i saxlanılır.
  Hərəkətsizlik müddəti 2 saat, mütləq müddət 12 saat (env ilə dəyişir). Girişdə yeni sessiya (fixation qorunması).
  Logout sessiyanı serverdə silir. Parol dəyişəndə, istifadəçi bloklananda və ya silinəndə köhnə sessiyalar etibarsız olur.
  İstifadəçi başına maks. 10 aktiv sessiya.
- **Brute-force**: hesab üzrə 15 dəqiqədə 5 uğursuz cəhd → hesab 15 dəqiqəlik bloklanır (çox IP-dən paylanmış hücuma da qarşı);
  IP üzrə 15 dəqiqədə 20 uğursuz cəhd; əlavə olaraq IP üzrə dəqiqədə 10 giriş sorğusu.
- **CSRF**: (1) `SameSite=Strict` cookie, (2) bütün vəziyyəti dəyişən `/api/*` sorğularında `Origin`/`Sec-Fetch-Site`
  yoxlaması, (3) B2B əməliyyatlarında (`/api/selections`, logout) sessiyaya bağlı `X-CSRF-Token`,
  (4) POST yalnız `application/json` qəbul edir (HTML formalarından CSRF mümkün deyil).
- **Avtorizasiya / IDOR**: `/api/b2b/leads` və `/api/selections` (yaratma) sessiya tələb edir; agentlik **sessiyadan**
  götürülür, sorğu parametrləri (`?agency=`) nəzərə alınmır. Lead-lər `agencyId` ilə bağlanır (ad ilə yox).
- Frontend sessiyanı `localStorage`-də saxlamır; agent rejimi (aviabilet, avtomobil) yalnız `/api/b2b/me` təsdiq edəndə açılır.
  Köhnə `localStorage.b2bSession` heç nəyə icazə vermir və silinir. Logout-da B2B axtarış tarixçəsi (müştəri adları) silinir.

### 2.3 Qiymət manipulyasiyası

- **Seçim linki**: klient yalnız axtarış parametrlərini və təklif id-lərini göndərir; server axtarışı özü yenidən icra edir,
  qiyməti, otel adını, operatoru öz nəticəsindən götürür. Klientin qiyməti/agentlik adı nəzərə alınmır.
  Komissiya 0–100% aralığında.
- **Avtomobil sifarişi**: server axtarışı təkrarlayır, təklifi id ilə tapır (əvvəlcədən belə idi).
- **Paylaşılan seçimdən lead**: qiymət və agentlik serverdə saxlanılan seçimdən götürülür.
- Müştəri görünüşündə (`/api/selections/:id`) operator adı, net qiymət, komissiya, `agencyId` göndərilmir.

### 2.4 Giriş məlumatlarının yoxlanması və injection

- Sorğu parametrləri: xüsusi parser — yalnız sadə string-lər (iç-içə obyekt/massiv yox), təkrarlanan parametrdə birincisi
  (HTTP Parameter Pollution), maks. 60 parametr, 1000 simvol, `__proto__`/`constructor`/`prototype` atılır.
- JSON body: maks. **16 KB** (artıq → 413), dərinlik ≤ 6, açar sayı ≤ 300, `__proto__`/`constructor`/`prototype`
  açarları → 400 (prototype pollution).
- Müraciətlər: ağ siyahı sahələr, uzunluq limitləri, ad (`\p{L}`), telefon (7–15 rəqəm), e-poçt formatı, idarəetmə simvolları
  təmizlənir. Avtomobil müraciətində icazəsiz sahə rədd edilir; sənəd (pasport, vəsiqə) məlumatı toplanmır.
- **Honeypot**: formalarda gizli `website` sahəsi; doldurulubsa müraciət saxlanılmır (bot fərqi bilməsin deyə 201 qaytarılır).
- SQL/NoSQL yoxdur (hələ DB yoxdur); obyekt tipli dəyərlər (`{"$ne":1}`) string yoxlamasından keçmir.
- Açıq yönləndirmə yoxdur (server `redirect` istifadə etmir); frontend xarici linkləri yalnız `https://wa.me/` üçün qurur,
  `safeUrl()` yalnız http(s) URL-lərə icazə verir.

### 2.5 XSS

- Bütün `innerHTML` yerləri yoxlanıldı: dinamik dəyərlər `esc()` (& < > " ') ilə escape olunur — həm mətn, həm atribut
  kontekstində. Rənglər yalnız `#hex` və ya serverin sabit konfiqurasiyasından, URL-lər `encodeURIComponent` ilə.
- Paylaşılan səhifədə agentlik/müştəri adları `textContent` ilə yazılır.
- `target="_blank"` linklərində `rel="noopener noreferrer"`.
- URL parametrlərindən gələn dəyərlər validasiya olunur (məs. seçim id-si `^[A-Za-z0-9_-]{12}$`, tarixlər, siyahı dəyərləri).
- CSV ixracında formula injection qorunması (`=`, `+`, `-`, `@` ilə başlayan xanalar).
- CSP ikinci müdafiə xəttidir: escape-də səhv olsa belə inline skript icra olunmur.

### 2.6 DoS və resurs limitləri

- Rate limiting vahid middleware ilə (`src/security/rateLimit.js`): ümumi API 600 sorğu / 5 dəq / IP, axtarış endpoint-ləri
  60 / dəq / IP, lead 20 / 10 dəq, avia/avto müraciət 10 / 10 dəq, seçim linki 30 / 10 dəq / istifadəçi, giriş — bax §2.2.
  429 cavabında `Retry-After`. Sayğac yaddaşı məhduddur (ən köhnə açarlar silinir, hamısı sıfırlanmır).
- `trust proxy` env ilə (`TRUST_PROXY`) — düzgün qurulmasa rate limit ya bütün istifadəçiləri bir IP sayar, ya da
  `X-Forwarded-For` saxtalaşdırılaraq keçilə bilər. `true` dəyəri tövsiyə olunmur.
- Yaddaş strukturları məhduddur: qiymət keşi 150 açar, leadlər 2000, müraciətlər 1000/5000, seçimlər 20 000
  (agentlik başına 500 — bir hesab başqalarının linklərini sıxışdırıb silə bilməz), sessiyalar 20 000.
- Nəticə ölçüləri: axtarış `flat` siyahısı ≤ 1000, aviabilet qrupları ≤ 150.
- Server vaxt limitləri: başlıqlar 20 san, sorğu 30 san, keep-alive 5 san (slowloris).
- Regex-lər ReDoS üçün yoxlanıldı; yoxlamadan əvvəl uzunluq məhdudlaşdırılır.

### 2.7 Xətalar və loglar

- Mərkəzləşdirilmiş xəta handler: istifadəçiyə stack və daxili mesaj göstərilmir (`{"error":"Daxili xəta"}`),
  body-parser xətaları düzgün 400/413/415 koduna çevrilir. Naməlum yollar → 404 JSON.
- Loglarda şəxsi məlumat maskalanır: telefon (`*******33`), ad (`N***`), e-poçt (`a***@domain`), IP (son oktet `x`).
  Aviabilet müraciətlərində tam IP saxlanılmır. Parol və sessiya id-si heç vaxt loglanmır.

### 2.8 Asılılıqlar və konfiqurasiya

- Yeganə runtime asılılıq: `express` — dəqiq versiyaya bağlıdır, `package-lock.json` commit olunur, `npm ci` istifadə edin.
  `npm audit` — 0 zəiflik (audit tarixində). `engines.node >= 22.12`.
- Konfiqurasiya env-dən (`.env.example`), repoda sirr yoxdur; `data/`, `.env*` `.gitignore`-dadır.
- Dev/test demo hesabı yalnız `NODE_ENV !== 'production'` olanda env ilə yaradılır və fayla yazılmır.

### 2.9 Testlər

`test/security.test.js`: başlıqlar və CSP, inline skript/handler olmaması, 413/400/415/404, prototype pollution və HPP,
rate limit, parol hash-i, yanlış parol/mövcud olmayan istifadəçi, brute-force bloku (hesab və IP), sessiyasız 401,
cookie atributları, logout/vaxtı bitmiş/parolu dəyişmiş sessiya, CSRF token və Origin, IDOR (başqa agentliyin leadləri),
XSS payload-larının escape olunması, honeypot, log maskalanması, agentlik limitləri. `npm test` ilə işləyir.

## 3. Bilinən məhdudiyyətlər (hazırkı DEMO arxitekturası)

- Leadlər, müraciətlər, seçim linkləri və sessiyalar **yaddaşdadır** — server yenidən başlayanda itir;
  ictimai lead spam-ı (çox IP-dən) köhnə leadləri sıxışdıra bilər. Production-dan əvvəl DB-yə köçürülməlidir.
- Rate limit və brute-force sayğacları bir prosesə aiddir — bir neçə server nüsxəsində Redis kimi ortaq store lazımdır.
- Hesab üzrə bloklama hücumçuya legitim hesabı 15 dəqiqəlik bloklamağa imkan verir (DoS); real versiyada CAPTCHA /
  e-poçt ilə kilid açma və 2FA tövsiyə olunur.
- Admin paneli yoxdur: hesablar CLI ilə idarə olunur; agentlik daxilində rol fərqi hələ tətbiq olunmur (admin = manager).
- Paylaşılan seçim linki "capability URL"-dir (72 bit təsadüfi id, 30 gün): linki alan hər kəs müştəri görünüşünü görür
  (operator/net qiymət görünmür). Linki ləğv etmək funksiyası hələ yoxdur.
- B2C axtarış nəticələri (operator adı və qiymət) ictimaidir — bu, müqayisə saytının əsas funksiyasıdır.
- `style-src-attr 'unsafe-inline'` (bax §2.1).

## 4. Production üçün qalan addımlar

1. **HTTPS/TLS**: yalnız HTTPS (TLS 1.2+, tövsiyə 1.3), HTTP → HTTPS yönləndirmə reverse proxy-də; `NODE_ENV=production`
   (Secure cookie, HSTS); HSTS stabil olduqdan sonra `preload` haqqında qərar. Node prosesi yalnız `127.0.0.1`-də dinləsin
   (`HOST=127.0.0.1`), `TRUST_PROXY` proxy sxeminə uyğun qurulsun.
2. **Verilənlər bazası**: PostgreSQL (parametrləşdirilmiş sorğular / ORM), ayrıca minimum hüquqlu DB istifadəçisi,
   TLS bağlantı; disk/volume şifrələməsi (at-rest), həssas sahələr üçün (telefon, e-poçt) tətbiq səviyyəsində şifrələmə
   nəzərdən keçirilsin. Sessiya və rate limit üçün Redis. Şəxsi məlumatlar üçün saxlama müddəti və avtomatik silmə.
3. **Sirlərin idarəsi**: DB parolu, API açarları (operator inteqrasiyaları, SMS/e-poçt) yalnız hosting-in secret manager-i
   və ya env vasitəsilə; repoya və loglara düşməsin; rotasiya qaydası; operator API açarları hər mühit üçün ayrı.
4. **Backup**: gündəlik şifrələnmiş backup (DB + hesablar), ayrı yerdə saxlanılsın, bərpa mütəmadi sınansın.
5. **Monitorinq və loglama**: strukturlaşdırılmış loglar (maskalanmış), mərkəzləşdirilmiş log saxlanması, xəbərdarlıqlar
   (5xx artımı, çoxlu 401/429, uğursuz giriş dalğası), uptime monitorinqi; audit log (kim, nə vaxt, hansı lead-ə baxdı).
6. **WAF / Cloudflare**: DDoS qorunması, bot idarəetməsi, origin IP-ni gizlətmək (yalnız Cloudflare IP-lərindən qəbul),
   `TRUST_PROXY` Cloudflare + proxy sxeminə uyğun. Login və müraciət formalarına Turnstile/CAPTCHA.
7. **Ödənişlər (PCI DSS)**: kart məlumatı (PAN, CVV, son istifadə tarixi) **heç vaxt** TurTap serverinə gəlməməli,
   saxlanmamalı və loglanmamalıdır. Bankın **hosted payment page** (yönləndirmə) və ya bankın iframe/tokenizasiya həlli
   istifadə edilsin — bu, PCI DSS öhdəliyini minimuma (SAQ A) endirir. Ödəniş nəticəsi yalnız bankın server-server
   bildirişi (imza yoxlaması ilə) əsasında qəbul edilsin, brauzerin "uğurlu" yönləndirməsinə etibar edilməsin;
   məbləğ həmişə serverdə hesablanır. CSP-yə bankın domeni yalnız lazım olan direktivlərə əlavə olunsun.
8. **Hesab təhlükəsizliyi**: 2FA (TOTP) agentlik hesabları üçün, parol bərpası (birdəfəlik, qısa müddətli token),
   admin paneli (rollar, istifadəçini bloklama, sessiyaları ləğv etmə), sızmış parol yoxlaması (HIBP k-anonymity).
9. **Şəxsi məlumatların qorunması**: Azərbaycan Respublikasının şəxsi məlumatlar haqqında qanunvericiliyinə uyğunluq
   (razılıq, məqsədin məhdudlaşdırılması, saxlama müddəti, subyektin hüquqları, məlumatın ölkədən kənara ötürülməsi,
   lazım olduqda qeydiyyat tələbləri) **hüquqşünasla yoxlanılmalıdır**. Saytda məxfilik siyasəti və formalarda razılıq
   mətni yerləşdirilsin. Avropa İttifaqı vətəndaşlarına xidmət olarsa GDPR tələbləri də nəzərə alınsın.
10. **Proses**: asılılıq yeniləmələri (Dependabot/Renovate), CI-də `npm ci && npm test && npm audit`, kod review,
    production-dan əvvəl müstəqil penetrasiya testi.

## 5. Zəiflik bildirmə qaydası

Təhlükəsizlik zəifliyi tapdınızsa, lütfən **açıq GitHub issue yaratmayın**.

- GitHub-da repozitoriyanın **Security → Report a vulnerability** (private vulnerability reporting) bölməsindən
  və ya layihə sahibinə birbaşa (şəxsi mesajla) bildirin. Rəsmi təhlükəsizlik e-poçtu domen alındıqdan sonra
  burada göstəriləcək (məs. `security@` + layihə domeni) və `/.well-known/security.txt` əlavə olunacaq.
- Bildirişdə: zəifliyin təsviri, təkrar addımları, təsiri, mümkünsə proof-of-concept.
- Cavab müddəti: qəbul — 3 iş günü ərzində, ilkin qiymətləndirmə — 10 iş günü ərzində.
- Xahiş: real istifadəçilərin məlumatına çıxış etməyin, xidməti pozmayın (DoS etməyin), düzəliş dərc olunana qədər
  zəifliyi açıqlamayın. Vicdanlı tədqiqatçılara qarşı hüquqi addım atılmayacaq.

## 6. Audit nəticəsi (2026-11) — tapılan zəifliklər və düzəlişlər

| # | Ciddilik | Zəiflik | Düzəliş |
|---|---|---|---|
| 1 | Kritik | B2B "giriş" yalnız `localStorage`-də idi; `/api/b2b/leads?agency=<ad>` agentlik adını bilən hər kəsə müştəri adlarını və telefonlarını qaytarırdı (autentifikasiya + IDOR) | scrypt hesablar, httpOnly sessiya, agentlik sessiyadan, `agencyId` ilə filtr |
| 2 | Yüksək | `/api/selections` autentifikasiyasız idi, agentlik adı və qiymət klientdən gəlirdi — başqa agentlik adına saxta link, qiymət manipulyasiyası | auth + CSRF; qiymət/ad serverin öz axtarışından |
| 3 | Yüksək | Agent rejimi (aviabilet, avtomobil) `localStorage.b2bSession` ilə hər kəs tərəfindən açılırdı | `/api/b2b/me` server təsdiqi |
| 4 | Orta | Təhlükəsizlik başlıqları yox idi (CSP, clickjacking, nosniff, HSTS), `X-Powered-By` açıq idi | §2.1 |
| 5 | Orta | Rate limit dağınıq idi, sayğac dolduqda bütün xəritə sıfırlanırdı (limitdən yayınma); ümumi/axtarış limiti yox idi | vahid limiter, ümumi + endpoint limitləri |
| 6 | Orta | `extended` query parser iç-içə obyektlər/massivlər qəbul edirdi; JSON body-də `__proto__` yoxlanmırdı | sadə query parser, body yoxlaması |
| 7 | Orta | Default Express xəta handler-i dev rejimində stack göstərirdi; `/api/search` daxili xəta mesajını 400 kimi qaytarırdı | mərkəzləşdirilmiş handler, `QueryError` |
| 8 | Orta | Yaddaş strukturları: bir istifadəçi bütün seçim linklərini sıxışdıra bilərdi | agentlik başına limit |
| 9 | Aşağı | `rel="noopener"` (noreferrer yox), CSV formula injection, bəzi rəng/rəqəm dəyərləri escape-siz | düzəldildi |
| 10 | Aşağı | Lead-lərdə ad/telefon formatı zəif, bot qorunması yox idi; aviabilet müraciətlərində tam IP saxlanılırdı | ad/telefon regex, honeypot, maskalanmış IP |
| 11 | Aşağı | `?today=` parametri ilə keçmiş tarixə aviabilet axtarışı | yalnız dev/test rejimində |
