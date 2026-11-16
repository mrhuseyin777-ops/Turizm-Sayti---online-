# TurTap — tur və otel müqayisə platforması

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
Hesablar `data/accounts.json`-da saxlanılır (scrypt hash; `data/` git-ə düşmür).

Yalnız lokal inkişaf üçün (production-da işləmir) yaddaşda demo hesab:

```bash
B2B_DEMO_USER=demo B2B_DEMO_PASSWORD='öz-lokal-parolunuz-12+' npm start
```

Təhlükəsizlik modeli, tətbiq olunan qorunmalar və production üçün qalan addımlar: [`SECURITY.md`](SECURITY.md).

## Struktur

```
server.js                 Express server: təhlükəsizlik qatı, API (/api/search, /api/suggest), 404/xəta handler
src/env.js                Mühit konfiqurasiyası (env)
src/security/             Başlıqlar/CSP, rate limit, Origin (CSRF), body/query yoxlaması
src/auth/                 B2B hesablar (scrypt), sessiyalar, brute-force qorunması
scripts/create-agency.js  Agentlik/istifadəçi yaratmaq (npm run create-agency)
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
