# TurTap — tur və otel müqayisə platforması

Azərbaycandakı tur operatorlarının (Summer Tour, Funsun, Kompas və s.) tur və otel
qiymətlərini bir axtarışda toplayıb **ən ucuzdan bahalıya** düzən platforma. İki hissə var:

- **B2C** (`/`) — müştəri istiqamət, tarix və büdcə seçir, bütün operatorların təklifləri müqayisə olunur.
- **B2B** (`/b2b`) — tur menecerləri üçün: otel × operator matrisi, komissiya hesabı, müştəriyə hazır təklif mətni, CSV.

> ⚠️ Hazırda qiymətlər **demo məlumatdır**. Real operator inteqrasiyası üçün bax: [`docs/PLAN.md`](docs/PLAN.md).

## İşə salmaq

```bash
npm install
npm start        # http://localhost:3000
npm test
```

## Struktur

```
server.js                 Express server və API (/api/search, /api/suggest, /api/leads)
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
