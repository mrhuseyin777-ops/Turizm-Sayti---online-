# Avtomobil modulu (icarə + transfer)

Müştəri tur zamanı özünə maşın seçir:

- **Avtomobil icarəsi (özü sürür)**: götürmə/qaytarma yeri (fərqli ola bilər), tarix-saat, sürücü yaşı, valyuta.
  Eyni model ("Toyota Corolla və ya oxşar") bir neçə şirkətdə müqayisə olunur, ucuzdan bahalıya; ümumi və gündəlik qiymət.
- **Sürücülü maşın / transfer**: hava limanı ↔ otel, şəhərlərarası (eyni ölkə daxilində) və günlük sürücülü (8 saat / 200 km).
  Maşın sinfi (sedan, minivan, VIP, mikroavtobus) nəfər və baqaja görə avtomatik seçilir; qiymət sabitdir.

Real satış yoxdur: "Sifariş müraciəti" menecerə gedir. **Şirkət adları uydurmadır, qiymətlər DEMO-dur.**

## Fayllar

| Fayl | Nə edir |
|---|---|
| `src/cars/locations.js` | Götürmə nöqtələri: hava limanları + şəhər mərkəzləri. Şəhər id-ləri `src/data/catalog.js` ilə eynidir (`antalya`, `baku`, ...) |
| `src/cars/fleet.js` | Kateqoriyalar, nümunə modellər, demo icarə və transfer şirkətləri, mövsüm/ölkə əmsalları |
| `src/cars/providers.js` | Demo provayderlər (deterministik hash əsaslı qiymət). Real adapter eyni interfeysi qaytarmalıdır |
| `src/cars/search.js` | Parametr yoxlaması, provayderlərin paralel sorğusu, valyuta, filtrlər, qruplaşdırma |
| `src/cars/requests.js` | Müraciətin ciddi validasiyası; təklif serverdə yenidən hesablanır |
| `src/routes/cars.js` | API (server.js tərəfindən avtomatik qoşulur) |
| `public/cars.html`, `public/js/cars.js`, `public/css/cars.css` | UI |

## API

- `GET /api/cars/locations?q=` — nöqtə axtarışı (AZ/EN/RU adlar, IATA kodu).
- `GET /api/cars/search?pickup=antalya&dropoff=&from=YYYY-MM-DD&fromTime=10:00&to=YYYY-MM-DD&toTime=10:00&age=30&currency=AZN`
  - filtrlər: `categories=suv,minivan`, `transmission=automatic|manual`, `minSeats=7`, `fullInsurance=1`, `freeCancel=1`, `companies=sahil`, `maxPrice=`, `sort=price|daily|price_desc`
  - əlavələr (ümumi qiymətə daxil olur): `childSeats=0..3`, `gps=1`, `extraDriver=1`
- `GET /api/cars/transfers?mode=transfer&from=ayt-apt&to=antalya-city&date=&time=&pax=&bags=` və ya `mode=daily&from=baku&days=3`
- `POST /api/cars/requests` — `{ name, phone, note?, kind: "rental"|"transfer", query, offerId }`.
  İcazəli sahələrdən kənar hər sahə rədd edilir (sürücülük vəsiqəsi, pasport və s. **toplanmır** — götürmə zamanı yoxlanılır).
  Server qiyməti müştəridən qəbul etmir: axtarışı təkrar icra edib təklifi tapır. Sadə IP limiti var. Hazırda yaddaşda saxlanılır.

Qiymət qaydaları (demo): mövsüm (dəniz/Körfəz/şəhər/daxili), müddət endirimi (3+/7+/14+ gün), fərqli yerdə qaytarma
(eyni şəhər daxilində sabit, şəhərlərarası km əsaslı; başqa ölkə dəstəklənmir), 25 yaşdan aşağı əlavə (bəzi şirkətlərdə min. yaş 22–23,
premium 25+), gündəlik əlavələr maks. 10 günə hesablanır. Transferdə gecə (22:00–06:00) +20%.

## Tur inteqrasiyası

`/cars.html?loc=antalya&from=YYYY-MM-DD&to=YYYY-MM-DD` avtomatik axtarır (əlavə: `drop=`, `tab=transfer`).
Tur/otel nəticə kartında "🚗 Maşın əlavə et" linki bu parametrlərlə açılır (checkIn → checkIn + gecə).
Kataloqda olub avtomobil nöqtəsi olmayan istiqamət (məs. Maldiv) üçün məlumat mesajı göstərilir.

## B2B

B2B hesabı ilə daxil olunubsa (server sessiyası, `/api/b2b/me`) agent rejimi: komissiya % (`b2bCarMarkup`), şirkət adı + net qiymət, müştəri qiyməti
və müştəriyə hazır mətn (şirkət adı gizli) — Kopyala / WhatsApp.

## Real inteqrasiya yolları

1. **Yerli icarə şirkətləri ilə birbaşa müqavilə** (xüsusilə Azərbaycan və Gürcüstan): qiymət cədvəli (sezon × sinif × müddət)
   CSV/Google Sheet və ya sadə admin panel vasitəsilə yüklənir, mövcudluq müraciətdən sonra menecer tərəfindən təsdiqlənir.
   Komissiya/net qiymət, depozit, sığorta və ləğv şərtləri hər müqavilədə ayrıca razılaşdırılır.
2. **Transfer şirkətləri / yerli sürücü parkları**: marşrut üzrə sabit qiymət cədvəli (hava limanı → zona) — mövcud
   `TRANSFER_CLASSES` strukturuna uyğun gəlir.
3. **Aggregator / partnyor API-ləri**: avtomobil icarəsi və transfer aggregatorlarının partnyor (affiliate və ya B2B) proqramları
   adətən axtarış, qiymət və rezervasiya API-si və ya yönləndirmə linki təqdim edir. Şərtlər (komissiya, giriş tələbləri,
   keşləmə qaydaları, brend istifadəsi) hər partnyorla ayrıca öyrənilməli və müqavilə ilə təsdiqlənməlidir.
4. Texniki olaraq hər mənbə `src/cars/providers.js`-dəki interfeysi (`search(q)` / `quote(q)`) qaytaran ayrıca adapter olur;
   `search.js` dəyişmədən paralel sorğulama, valyuta və filtrlər işləyir. Real versiyada: müraciətlərin DB-də saxlanması,
   menecerə bildiriş (e-poçt/WhatsApp), məzənnələrin gündəlik yenilənməsi.
