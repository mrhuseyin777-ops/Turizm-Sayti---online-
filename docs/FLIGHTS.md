# Aviabilet modulu (DEMO)

Aviabilet axtarışı və müqayisəsi: B2C (müştəri) və B2B (agent rejimi). Bilet hələ **onlayn satılmır** —
"Bileti sifariş et" müraciəti menecerə gedir. Bütün uçuşlar, cədvəllər və qiymətlər **nümunədir**;
aviaşirkət adları yalnız illüstrasiya üçündür və həmin şirkətlərin real təklifləri deyil.

## Struktur

| Fayl | Nə edir |
|---|---|
| `src/flights/airports.js` | Hava limanları kataloqu (AZ/EN/RU adlar, alias-lar, köhnə kodlar: `TSE→NQZ`, `KVD→GNJ`), autocomplete, çox hava limanlı şəhərlər (`IST,SAW`, `SVO,VKO,DME`), məsafə, UTC fərqi (DST təxmini) |
| `src/flights/carriers.js` | DEMO daşıyıcılar (tip: full / hybrid / lcc, baqaj normaları), marşrut şəbəkəsi, aktarma üçün tərəfdaş cütləri |
| `src/flights/schedule.js` | Deterministik (hash əsaslı) cədvəl generatoru: birbaşa, 1 və 2 aktarmalı itinerarlar (minimum aktarma vaxtı ilə) |
| `src/flights/pricing.js` | DEMO tarif: məsafə, daşıyıcı tipi, mövsüm (region üzrə), həftə günü, uçuşa qalan gün, gediş saatı, sinif; tarif ailələri (baqajlı/baqajsız, qaytarılma) |
| `src/flights/providers/` | Satış mənbələri (adapterlər). İndi 4 DEMO mənbə: aviaşirkət saytı, GDS konsolidator, 2 OTA |
| `src/flights/search.js` | Validasiya, mənbələrin paralel sorğusu (timeout ilə), uçuş üzrə qruplaşdırma, filtrlər, sıralama, facet-lər, qiymət təqvimi (±3 gün) |
| `src/flights/requests.js` | Müraciət validasiyası və yaddaşda saxlanma (ağ siyahı; pasport məlumatı qəbul edilmir) |
| `src/routes/flights.js` | Express router (server.js tərəfindən avtomatik qoşulur) |
| `public/flights.html`, `public/js/flights.js`, `public/css/flights.css` | Frontend |
| `test/flights.test.js` | Testlər (`npm test`) |

## API

- `GET /api/flights/airports?q=&lang=az|en|ru` — autocomplete.
- `GET /api/flights/search` — parametrlər: `from`, `to` (IATA və ya eyni şəhərin kodları vergüllə), `trip=oneway|round`,
  `depart`, `return` (YYYY-MM-DD), `adults` (1–9), `children` (0–8), `infants` (≤ böyük sayı), `cabin=economy|business`,
  `direct=1`, `bags=1`, `stops=0,1,2`, `airlines=TK,J2`, `times=morning,day,evening,night`, `maxPrice`, `currency`,
  `sort=price|fastest|best`, `calendar=0` (təqvimi söndür). Cavab: `groups` (uçuş → `providers` hər mənbənin ən ucuz təklifi,
  `offers` bütün tariflər), `summary`, `facets`, `sources`, `calendar`.
- `POST /api/flights/requests` — `{ name, phone, email?, note?, flightId, offerId? }`. Yanlış sahələr `400 { error, fields }`.
  Sadə limit: IP başına 10 dəqiqədə 10 müraciət.

"Ən yaxşı" sıralama: `qiymət/minQiymət + 0.7 × müddət/minMüddət + 0.1 × aktarma` (kiçik daha yaxşı).

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
