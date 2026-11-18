# Aviabilet modulu (DEMO)

Aviabilet axtarışı və müqayisəsi: B2C (müştəri) və B2B (agent rejimi). Bilet hələ **onlayn satılmır** —
"Bileti sifariş et" müraciəti menecerə gedir. Bütün uçuşlar, cədvəllər və qiymətlər **nümunədir**;
aviaşirkət adları yalnız illüstrasiya üçündür və həmin şirkətlərin real təklifləri deyil.

## Struktur

| Fayl | Nə edir |
|---|---|
| `src/flights/airports.js` | Hava limanları kataloqu (AZ/EN/RU adlar, alias-lar, köhnə kodlar: `TSE→NQZ`, `KVD→GNJ`), autocomplete, çox hava limanlı şəhərlər (`IST,SAW`, `SVO,VKO,DME`), məsafə, UTC fərqi (DST təxmini) |
| `src/flights/regulated.js` | Tənzimlənən daxili marşrutlar (GYD↔NAJ, GNJ↔NAJ) — qiymət göstərilmir |
| `src/flights/alerts.js` | "Qiyməti izlə": atomik JSON saxlama (`data/flight-alerts.json`), token yoxlaması, avtomatik silinmə, bildiriş interfeysi (stub) |
| `src/flights/carriers.js` | DEMO daşıyıcılar (tip: full / hybrid / lcc, baqaj normaları), marşrut şəbəkəsi, aktarma üçün tərəfdaş cütləri |
| `src/flights/schedule.js` | Deterministik (hash əsaslı) cədvəl generatoru: birbaşa, 1 və 2 aktarmalı itinerarlar (minimum aktarma vaxtı ilə), DEMO "ayrı biletlər" (self-transfer) və hava limanı dəyişən marşrutlar, aktarma riski nişanları |
| `src/flights/pricing.js` | DEMO tarif: məsafə, daşıyıcı tipi, mövsüm (region üzrə), həftə günü, uçuşa qalan gün, gediş saatı, sinif; ümumi adlı tarif ailələri (Light / Standard / Flex / Business), baqaj əlavəsi |
| `src/flights/providers/` | Satış mənbələri (adapterlər). İndi 4 DEMO mənbə: aviaşirkət saytı, GDS konsolidator, 2 OTA |
| `src/flights/search.js` | Validasiya, mənbələrin paralel sorğusu (timeout ilə), uçuş üzrə qruplaşdırma, baqajla ümumi qiymət, filtrlər, sıralama, facet-lər, qiymət təqvimi (±3 gün və bütün ay), "Hara uça bilərəm?", keş |
| `src/flights/requests.js` | Müraciət validasiyası və yaddaşda saxlanma (ağ siyahı; pasport məlumatı qəbul edilmir) |
| `src/routes/flights.js` | Express router (server.js tərəfindən avtomatik qoşulur) |
| `public/flights.html`, `public/js/flights.js`, `public/css/flights.css` | Frontend |
| `test/flights.test.js`, `test/flights-p1.test.js` | Testlər (`npm test`) |

## API

- `GET /api/flights/airports?q=&lang=az|en|ru` — autocomplete.
- `GET /api/flights/search` — parametrlər: `from`, `to` (IATA və ya eyni şəhərin kodları vergüllə), `trip=oneway|round`,
  `depart`, `return` (YYYY-MM-DD), `adults` (1–9), `children` (0–8), `infants` (≤ böyük sayı), `cabin=economy|business`,
  `direct=1`, `bags=1`, `stops=0,1,2`, `airlines=TK,J2`, `times=morning,day,evening,night`, `maxPrice`, `currency`,
  `sort=price|fastest|best`, `calendar=0` (təqvimi söndür), `bagCount=0|1|2` (hər sərnişinə çanta sayı), `protected=1`
  (yalnız qorunan aktarmalar). Cavab: `groups` (uçuş → `providers` hər mənbənin ən ucuz təklifi, `offers` bütün tariflər,
  `families` tarif ailələri cədvəli, `risks`, `selfTransfer`), `summary`, `facets` (+ `protected`), `sources`, `calendar`, `regulated`.
  Hər təklifdə: `price` (seçilmiş baqajla ümumi), `ticket` (baqajsız), `bagFee`, `breakdown: { fare, tax, bags }`.
- `GET /api/flights/calendar?from=&to=&month=YYYY-MM` — ay təqvimi: ayın hər günü üçün ən ucuz qiymət (axtarışla eyni hesab,
  eyni filtrlər: `adults…`, `cabin`, `direct`, `bagCount`, `protected`, `airlines`, `stops`, `currency`). Gediş-dönüşdə `trip=round&nights=0..30`
  (dönüş = gediş + nights). Cavab: `days[{ date, return, price, cheap, disabled }]` (ən ucuz 3 gün `cheap`), `prevMonth`/`nextMonth`
  (bu gündən 360 gün ərzində), `min`, `max`. Keş: 10 dəq / 300 açar; limit: IP başına dəqiqədə 30 sorğu (explore ilə ortaq).
- `GET /api/flights/explore?from=GYD&depart=YYYY-MM-DD | month=YYYY-MM&budget=&direct=1&currency=&lang=` — "Hara uça bilərəm?":
  bütün istiqamətlər (şəhər üzrə, məs. `IST,SAW`) üzrə ən ucuz birtərəfli qiymət (1 böyük, ekonom), ucuzdan bahalıya, ən çox 60 nəticə.
  Ay rejimində ayın hər 3-cü günü yoxlanılır (keşsiz < 500 ms). Tənzimlənən marşrutlar qiymətsiz `regulated` siyahısında. `estimate: true`.
- `POST /api/flights/alerts` — `{ from, to, trip, depart, return?, adults, children, infants, cabin, bagCount, currency, email?, mode: daily|drop10 }`.
  Validasiya: axtarışla eyni marşrut yoxlaması, gediş tarixi gələcəkdə, e-poçt formatı, tənzimlənən marşrut qəbul edilmir, honeypot,
  limit: IP başına 10 dəq-də 10 sorğu və ən çox 20 aktiv izləmə. Cavab `201 { id, token, alert }` — token yalnız bu cavabda verilir.
- `GET /api/flights/alerts/:id` (başlıq `X-Alert-Token`) — izləmə + cari demo qiymət, `changePct`. E-poçt qaytarılmır.
- `DELETE /api/flights/alerts/:id` (JSON `{ token }` və ya `X-Alert-Token`) — silmə. Yanlış token və olmayan id eyni `404` alır.
- `POST /api/flights/requests` — `{ name, phone, email?, note?, flightId, offerId? }`. Yanlış sahələr `400 { error, fields }`.
  Sadə limit: IP başına 10 dəqiqədə 10 müraciət.

"Ən yaxşı" sıralama: `qiymət/minQiymət + 0.7 × müddət/minMüddət + 0.1 × aktarma` (kiçik daha yaxşı).

## P1 funksiyaları (DEMO)

- **Ay təqvimi**: ±3 gün zolağının altında "Bütün ay" — həftə günləri ilə şəbəkə (bazar ertəsi ilk gün), ən ucuz 3 gün yaşıl,
  qiyməti olmayan/keçmiş günlər boz, ‹ › ay keçidi, günə klik → həmin tarixə axtarış (gediş-dönüşdə gecə sayı saxlanılır).
- **"Hara uça bilərəm?"**: formadakı link; çıxış şəhəri (default Bakı), ay və ya tarix, büdcə, "yalnız birbaşa"; kartlar ucuzdan
  bahalıya (şəhər, ölkə, ən ucuz tarix, birbaşa/aktarmalı, aviaşirkət); karta klik → həmin marşrut və tarixlə axtarış.
  Qiymət "təxmini (demo)" kimi işarələnir.
- **Baqaj**: formada "Çanta (hər sərnişinə) 0/1/2". Tarifdə daxil olmayan çantalar üçün DEMO əlavə qiyməti (seqment məsafəsinə görə,
  2-ci çanta 1.5×, infant xaric, hər istiqamət) ümumi qiymətə qatılır; sıralama və təqvim bu ümumi qiymətlə işləyir. Kartda bölgü:
  bilet + vergi/yığım (DEMO: biletin 18%-i) + baqaj. Detal panelində tarif ailələri cədvəli (əl yükü, çanta, dəyişmə, qaytarma, oturacaq, qiymət)
  və "Seç" → həmin tariflə müraciət. Ailə adları ümumidir (Light / Standard / Flex) — **heç bir aviaşirkətin real tarif adı və şərtləri deyil**.
- **Aktarma riski nişanları** (kartda, kliklə izah; `title` tooltip): "Ayrı biletlər — aktarma qorunmur" (tərəfdaş olmayan daşıyıcıların
  birləşməsi, DEMO marşrutlar), "Hava limanı dəyişir" (IST↔SAW, SVO↔VKO↔DME; minimum 240 dəq), "Qısa aktarma" (< 60 dəq, böyük hub-larda
  < 90 dəq), "Gecə aktarması" (00:00–05:00 aralığına ≥ 90 dəq düşür), "Uzun gözləmə" (> 8 saat). Filtr: "Yalnız qorunan aktarmalar".
  Ayrı biletli marşrutlar demoda ~10% ucuz qiymətləndirilir (real bazardakı kimi cəlbedici, amma riskli).
- **Qiyməti izlə**: nəticələrin başında düymə → e-poçt (istəyə görə) + rejim (gündəlik / ≥10%). **E-poçt göndərmə xidməti hələ yoxdur**:
  `alerts.js`-də `notifier.send()` stub-dur (TODO), `runCheck()` hazırdır. UI bunu açıq deyir ("bildirişlər tezliklə — hazırda izləmə siyahısı").
  "İzlədiklərim": localStorage-də yalnız `{ id, token, route }`; hər açılışda serverdən cari demo qiymət və ilkin qiymətlə fərq (↑/↓ %).
  Serverdə token yalnız SHA-256 hash, IP yalnız hash kimi saxlanılır; gediş tarixi keçən izləmələr avtomatik silinir (hər sorğuda və saatda bir).
- **Bakı/Gəncə – Naxçıvan** (GYD↔NAJ, GNJ↔NAJ): DEMO qiymət qaytarılmır (API səviyyəsində `price: null`, təqvim/explore/izləmə də yoxdur).
  Əvəzinə məlumat bloku (tənzimlənən tarif, güzəştli kateqoriyalar, AZAL-da yoxlama, bayramdan əvvəl erkən alma tövsiyəsi) və
  "Menecerə müraciət" (`POST /api/flights/requests`, cədvəldən uçuş id-si ilə). Konkret məbləğ və qərar tarixi qəsdən yazılmayıb (təsdiqlənməyib).

## B2B agent rejimi

B2B agentlik hesabı ilə daxil olunubsa (`/b2b`, server sessiyası — `/api/b2b/me`) səhifədə "Agent rejimi" paneli görünür: komissiya %, net qiymət,
komissiya məbləği və müştəri qiyməti; seçilmiş uçuşlardan müştəriyə hazır mətn (mənbə adı və net qiymət gizli) —
Kopyala / WhatsApp. Qeyd: B2C görünüşündə də mənbə adları göstərilir (müqayisə məhsulun özüdür); agent rejimi əlavə olaraq
net/komissiyanı göstərir.

## Real inteqrasiya yolları

Hər real mənbə `src/flights/providers/` qovluğunda ayrıca adapter kimi yazılır və `providers/index.js`-də DEMO sətrinin
yerinə qoşulur. Adapter eyni interfeysi qaytarmalıdır: `search(query) -> Promise<FlightOffer[]>`
(format `demoProvider.js` başlığında). Aqreqator dəyişmir: uçuşlar seqmentlərə (reys nömrəsi + marşrut + vaxt) görə qruplaşdırılır.

Ümumi variantlar (şərtlər, qiymətlər və giriş tələbləri hər provayderdə fərqlidir — müqavilədən əvvəl yoxlanmalıdır):

1. **GDS** (Amadeus, Sabre, Travelport kimi sistemlər) — adətən IATA akkreditasiyası və ya konsolidator vasitəsilə giriş,
   müqavilə və sertifikasiya tələb olunur. Klassik aviaşirkətlərin geniş əhatəsi; bəzi lowcost-lar GDS-də olmaya bilər.
2. **NDC** (IATA New Distribution Capability) — aviaşirkətlə birbaşa və ya NDC aggregator vasitəsilə; zəngin tarif ailələri
   (baqaj, əlavə xidmətlər). Hər aviaşirkətlə ayrıca razılaşma lazım ola bilər.
3. **Aggregator / OTA API** — bir API ilə çox mənbə (GDS + NDC + lowcost). İnteqrasiyası ən sürətli yol ola bilər,
   amma komissiya/marja modeli və bilet yazma (ticketing) şərtləri provayderə bağlıdır.
4. **Lowcost-ların birbaşa API-ləri** — ayrıca müqavilə ilə.

İnteqrasiya zamanı nəzərə alınmalı:

- Axtarış nəticələri keş (TTL) ilə saxlanmalı; provayderlərin "look-to-book" limitləri ola bilər.
- Sifarişdən əvvəl qiymət yenidən yoxlanmalıdır (price re-check / offer price), çünki axtarış qiyməti dəyişə bilər.
- Rezervasiya (PNR) və bilet yazma üçün sərnişin məlumatları (pasport və s.) yalnız təhlükəsiz axın, şifrələmə
  və şəxsi məlumatların qorunması qaydalarına uyğun toplanmalıdır — indiki müraciət forması bunları qəsdən toplamır.
- Valyuta məzənnələri `src/config.js`-dən gəlir (DEMO); real versiyada mənbənin valyutası və rəsmi məzənnə istifadə olunmalıdır.
- Saat qurşaqları/DST: real versiyada provayderin verdiyi yerli vaxtlar istifadə olunur (indiki DST qaydası təxminidir).

## Məhdudiyyətlər (DEMO)

- Marşrut şəbəkəsi, reys nömrələri, cədvəllər və qiymətlər uydurmadır, real tarifləri əks etdirmir.
- Gediş-dönüşdə dönüş eyni əsas daşıyıcı ilə seçilir (hər gediş üçün ən ucuz 2 dönüş variantı).
- Müraciətlər yaddaşda saxlanır (server yenidən başlayanda silinir); bildiriş (e-poçt/CRM) yoxdur.
- Qiymət izləmə bildirişləri göndərilmir (e-poçt xidməti yoxdur); demo qiymət deterministik olduğu üçün dəyişiklik adətən 0%-dir
  (yalnız "bu gün" dəyişdikcə rezervasiya əyrisi ilə). İzləmə faylı bir proses üçündür (cluster-də DB lazımdır).
- "Hara uça bilərəm?" ay rejimində bütün günləri yox, hər 3-cü günü yoxlayır; yalnız birtərəfli, 1 böyük.
- Ayrı bilet / hava limanı dəyişən marşrutlar və aktarma riskləri demo şəbəkədən hesablanır; vizalı tranzit nişanı yoxdur.
- Vergi/yığım bölgüsü təxminidir (sabit faiz); baqaj qiyməti real aviaşirkət normalarını əks etdirmir.
