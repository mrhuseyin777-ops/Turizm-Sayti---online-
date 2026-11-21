# SAMO-tour Online operatorları: Summer Tour, Kompas, Funsun (FS Travel)

Tarix: 2026-11-16. Kod: `src/providers/samo/`, testlər: `test/samo.test.js`.

> **Hüquqi status:** operatorların icazəsi hələ **yoxdur**. Bu sənəddəki məlumatlar yalnız
> operatorların **ictimai axtarış səhifəsinin HTML mənbəyinə** (bir dəfə əl ilə açılıb) və
> SAMO-Soft-un ictimai saytındakı ümumi məlumata əsaslanır. Qiymət endpoint-ləri sorğulanmayıb,
> scrape edilməyib, gizli API tərs mühəndislik ilə çıxarılmayıb. Yoxlanılmayan hər şey
> "yoxlanılmadı" kimi qeyd olunub.

## 1. Tapıntılar: hər üç operator SAMO-tour Online istifadə edir

| Operator | İctimai axtarış səhifəsi | Sübut (səhifə mənbəyində) |
|---|---|---|
| **Summer Tour** | https://summertour.az/search_tour | `samo.ROUTES`, `samo.ROOT_URL = "/search_tour?"`, `samo.MODULE = "search_tour"`, `samo.jQuery(...)`, skriptlər `/public/js/search_tour/search_tour.js`, forma sahələri `TOWNFROMINC/STATEINC/TOURINC` |
| **Kompas** | https://online.az.kompastour.com/search_tour | eyni `samo.*` obyektləri + mənbədə `samosoft` sözü; `PROGRAMGROUPINC`, `FREIGHTTYPE` sahələri |
| **Funsun / FS Travel** | https://b2b.fstravel.asia/search_tour | eyni `samo.*` obyektləri + `samosoft`; `/currency?...&samo_action=embed` skriptləri; əlavə `TOURGROUP`, `PROGRAMINC`, `CHILD_IN_BED`, `COMFORTABLE_SEATS` sahələri |

Ümumi forma sahələri (hər üçündə): `TOWNFROMINC, STATEINC, TOURINC, CHECKIN_BEG, CHECKIN_END,
NIGHTS_FROM, NIGHTS_TILL, ADULT, CHILD, AGE1..AGE3, CURRENCY, TOWNS/TOWNS_ANY, STARS/STARS_ANY,
HOTELS/HOTELS_ANY, MEALS/MEALS_ANY, ROOMS/ROOMS_ANY, COSTMIN, COSTMAX, FREIGHT, MOMENT_CONFIRM,
FILTER, PARTITION_PRICE`. Formada tarix `dd.mm.yyyy` göstərilir; URL-də `YYYYMMDD` (sahibin nümunə URL-i).

Qeyd: sahibin göndərdiyi FS nümunə URL-ində `STATEFROM=367404` var — bu, HTML-də Almatı
şəhərinin `data-state-from` dəyəridir (yəni Qazaxıstan çıxışı). Azərbaycan üçün dəyər 433579-dur.

## 2. ID xəritəsi (yalnız HTML-dən təsdiqlənənlər)

### Çıxış (Azərbaycan)

| | Summer Tour | Kompas | FS Travel |
|---|---|---|---|
| STATEFROM (çıxış ölkəsi, `data-state-from`) | 36 | 61 | 433579 |
| TOWNFROMINC Bakı | 1930 | 1411 | 433614 |
| TOWNFROMINC Gəncə | — | 1512 | 433686 |

### Valyuta (CURRENCY)

| | USD | EUR | AZN | KZT |
|---|---|---|---|---|
| Summer Tour | 2 | — | — | — |
| Kompas | 2 | 3 | 13 | — |
| FS Travel | 2 | — | 25 | 11 |

### Ölkələr (STATEINC)

| Odiola | Summer Tour | Kompas | FS Travel |
|---|---|---|---|
| Türkiyə | 9 | yoxlanılmadı | 18803 |
| BƏƏ | yoxlanılmadı | yoxlanılmadı | 20613 |
| Misir | yoxlanılmadı | yoxlanılmadı | 18498 |
| Gürcüstan | yoxlanılmadı | yoxlanılmadı | 223991 |
| Maldiv | yoxlanılmadı | 40 * | 275410 |
| Mavriki / Seyşel | — | 86 / 77 * | 293483 / 284350 |

\* Kompas səhifəsi default olaraq **Vena** çıxışı ilə açılır və ölkə siyahısı çıxış şəhərindən asılıdır;
bu ID-lər Vena siyahısındandır, Bakı çıxışı üçün mövcudluğu yoxlanılmadı.
FS siyahısında 33 ölkə var (Qətər 759622, Tailand 20625, Vyetnam 293645, Şri-Lanka 20629, İndoneziya 250722,
Malayziya 435746, Özbəkistan 708675, Səudiyyə Ərəbistanı 841186, İordaniya 230174 və s. — tam siyahı `operators.js`-də).
Summer Tour səhifəsində Bakı çıxışı üçün yalnız Türkiyə göstərilir.

### Turlar (TOURINC) — məlumat üçün, deeplink-də göndərilmir

- Summer Tour: 257 "Antalya 2027", 259 "Antalya 2027 +1", 256 "Antalya winter 2026-2027 GDS", 255 "Istanbul 2026-2027 (Ajet) +1", 238 "Istanbul 2026-2027 GDS".
- FS Travel (Bakı, Türkiyə): 18888, 19210, 32723, 19125, 19360, 27489 ("Базовый тур Mongo ..."); TOURGROUP 28 "Antalya"; PROGRAMINC 5 GDS, 114 "Промо", 14 "Стандарт".

### Forma limitləri (deeplink bunlara sıxılır)

| | Böyük | Uşaq | Uşaq yaşı | Gecə |
|---|---|---|---|---|
| Summer Tour | 1–12 | 0–6 | 0–12 | 2–15 |
| Kompas | 1–6 | 0–8 | 0–17 | 1–21 |
| FS Travel | 1–8 | 0–3 | 0–15 | 2–28 |

Şəhər/kurort (TOWNS), otel, qida, otaq ID-ləri dinamik yüklənir və HTML-də yoxdur — **məlum deyil**.

## 3. İnteqrasiya yolları (prioritetlə)

### (a) Rəsmi agent API / XML-gateway — ən yaxşı yol

SAMO-Soft-un ictimai saytında (en.samo.ru) texniki xidmət tariflərində **"XML-Gateway of the tour
Operator"** modulu sadalanır; SAMO-incoming məhsulu üçün (inc.samo.ru) "üçüncü tərəf proqramla XML
gate vasitəsilə məlumat mübadiləsi" xidməti göstərilir; 2026-cı il buraxılışlarında iOL X B2B
platforması ilə inteqrasiya elan olunub. Bu məlumat axtarış nəticələrindən götürülüb — en.samo.ru bu
sessiyanın şəbəkəsindən açılmadı.

**Yoxlanılmadı:** XML-gateway-in protokolu (XML/JSON, SOAP/REST), autentifikasiya üsulu, cavab
formatı, limitlər, qiyməti, bu üç operatorda aktiv olub-olmadığı və agentə/aqreqatora verilib-verilmədiyi.
Bunlar yalnız operatordan (və ya onların vasitəsilə SAMO-Soft-dan) rəsmi sənəd kimi alınmalıdır.
Üstünlük: hər üç operator eyni sistemdədir — bir adapter (konfiqurasiya fərqləri ilə) üçünü də əhatə edə bilər.

### (b) Agent hesabı ilə B2B portal

Operatorla agent müqaviləsi bağlayıb `search_tour` portalına agent girişi almaq. Menecerlər qiymətə
əl ilə baxa bilər. Portalın avtomatik sorğulanması yalnız operatorun **yazılı razılığı** ilə və onun
göstərdiyi qaydada (limit, saat, endpoint) mümkündür — əks halda etmirik.

### (c) Deeplink — indi işləyir

`buildOperatorSearchUrl(operatorId, query)` Odiola axtarışını operatorun ictimai `search_tour`
səhifəsinin linkinə çevirir (çıxış şəhəri, ölkə, tarix aralığı, gecə, böyük, uşaq və yaşları,
valyuta). Server heç bir sorğu göndərmir — istifadəçi linkə özü keçir. Məhdudiyyətlər:
- uşaq yaşlarının (AGE1..AGE3) URL-dən avtomatik doldurulması **yoxlanılmadı**;
- səhifənin URL parametrlərinə əsasən axtarışı özü başladıb-başlatmadığı **yoxlanılmadı** (istifadəçi "Axtar" basmalı ola bilər);
- otel/kurort seçimi ötürülmür (ID-lər məlum deyil).

## 4. Operatora məktub şablonu

> **Mövzu:** Odiola — onlayn tur müqayisə platforması ilə əməkdaşlıq təklifi
>
> Hörmətli [Operatorun adı] komandası,
>
> Biz Odiola-ıq — Azərbaycanda tur paketlərini və otelləri bir axtarışda müqayisə edən onlayn
> platforma (B2C sayt + agentliklər üçün B2B panel). Məqsədimiz müştərini ən uyğun tura və
> birbaşa operatora yönləndirməkdir; ödəniş və rezervasiya operatorda qalır.
>
> Sizin rezervasiya sisteminiz SAMO-tour Online üzərində işlədiyi üçün rəsmi inteqrasiya texniki
> cəhətdən sadədir. Bizim istəyimiz:
> 1. **Agent API / XML-gateway girişi** (yalnız axtarış və qiymət, sonra isə — razılaşsaq — rezervasiya) və texniki sənəd;
> 2. **Agent / tərəfdaşlıq müqaviləsi** — komissiya və ya müraciət (lead) başına ödəniş modeli.
>
> Sizə faydası:
> - əlavə müştəri axını — Odiola istifadəçiləri birbaşa sizin turlarınıza yönləndirilir;
> - satış başına komissiya — yalnız nəticəyə görə ödəniş;
> - qiymətləriniz real vaxtda və düzgün göstərilir (köhnəlmiş qiymət riski yoxdur);
> - sorğu yükü sizin müəyyən etdiyiniz limitlərdə qalır, keşləmə tətbiq edirik.
>
> İcazəniz olmadan saytınızdan məlumat çəkmirik. Hazırda saytda yalnız "Operatorun saytında yoxla"
> linki ilə sizin ictimai axtarış səhifənizə yönləndirmə mümkündür — buna da etirazınız varsa bildirin.
>
> Görüş üçün uyğun vaxtınızı bildirməyinizi xahiş edirik.
>
> Hörmətlə,
> [Ad Soyad], Odiola · [telefon] · [e-poçt]

## 5. Real inteqrasiya üçün texniki checklist

1. [ ] Operatordan yazılı razılıq (e-poçt/müqavilə): istifadə həddi, keşləmə müddəti, qiymətin göstərilmə qaydası, brend/loqo istifadəsi.
2. [ ] Rəsmi API sənədi: endpoint, protokol, autentifikasiya, sorğu/cavab sxemi, xəta kodları, rate limit, test (sandbox) mühiti.
3. [ ] `operators.js` → `apiHosts`-a rəsmi host-u əlavə et (kod review ilə; yalnız https).
4. [ ] Etimadnamələri hosting panelində env kimi təyin et (`SAMO_<OP>_API_URL`, `_API_TOKEN` və ya `_API_LOGIN/_API_PASSWORD`); repoya yazma.
5. [ ] `buildRequest(query, {op, cfg})` — sənədə uyğun sorğu (Odiola query → operator ID-ləri: çıxış, ölkə, tarix, gecə, pax, yaşlar, valyuta).
6. [ ] `parseResponse(text, {op})` — real cavabı daxili `SamoItem` formatına gətir; sxemdən kənar sahələri at.
7. [ ] Kurort/rayon (town/district) ID → Odiola `destinationId` xəritəsi (hazırda yalnız tək istiqamətli sorğuda işləyir).
8. [ ] Otel ID xəritəsi (operatorlar arası eyni oteli qruplaşdırmaq üçün; məs. GIATA və ya ad+koordinat uyğunlaşdırması).
9. [ ] Qida/otaq kodlarının sənədə uyğun xəritəsi (`mapBoard`), yer statusu və stop-sale kodları.
10. [ ] Qiymət: ümumi qiymət vs. adambaşı, valyuta, erkən rezervasiya, ilkin ödəniş/ləğv şərtləri (`prepayment`, `freeCancelUntil`).
11. [ ] Real (anonimləşdirilmiş) cavab nümunəsi ilə testlər; hipotetik fixture-u əvəz et.
12. [ ] Monitorinq: xəta faizi, gecikmə, boş cavab; log-larda şəxsi məlumat və token olmamalıdır.
13. [ ] `ENABLED=1` əvvəl staging-də, aşağı limitlə; keş TTL-i (`config.priceCacheMinutes`) operatorla razılaşdır.
14. [ ] UI: `demo: false` mənbələr üçün "DEMO" nişanını götür, qiymət təzəliyi göstəricisi real `checkedAt` ilə.

## Mənbələr

- Operator səhifələrinin HTML mənbəyi (2026-11-16, əl ilə, bir dəfə).
- SAMO-Soft: [Basic prices for services](https://en.samo.ru/tour/maintenance.html), [Additional modules of SAMO-tour](https://en.samo.ru/tour/addons.html), [Online booking system for SAMO-tour (B2B)](https://en.samo.ru/tour/addons/item/546.html), [News](https://en.samo.ru/about/novosti.html), [SAMO-incoming](https://inc.samo.ru/en) — axtarış nəticələrinin xülasəsi əsasında; səhifələr bu sessiyada birbaşa açılmadı.
