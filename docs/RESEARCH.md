# TurTap — rəqib və bazar araşdırması

Tarix: 2026-11-16. Hazırlayan: bazar analitiki (AI köməkçi).

## 0. Metodologiya və məhdudiyyətlər (əvvəlcə oxuyun)

- **Saytların özü açılmadı.** Bu sessiyanın şəbəkə siyasəti xarici domenləri bloklayır: `summertour.az`, `funsun.az`, `kompastravel.az`, `etstur.com` və s. üçün həm `curl`, həm də səhifə yükləmə aləti "host tapılmadı / 403" qaytardı. Ona görə **heç bir saytın HTML mənbəyinə baxmaq mümkün olmadı** — SAMO/Paximum/Tourvisor kimi izləri səhifə kodunda yoxlamaq üçün bu domenlər sessiyanın şəbəkə ayarlarında icazəli edilməlidir.
- Bütün faktlar **web axtarış nəticələrindən** (axtarış sisteminin göstərdiyi səhifə fraqmentləri, rəsmi yardım/kampaniya səhifələri, App Store təsvirləri, sənaye məqalələri) götürülüb. Hər faktın yanında mənbə nömrəsi var (bölmə 4).
- **"yoxlanılmadı"** = bu sessiyada heç bir mənbədə təsdiqini tapmadım. Belə bəndlər ümumi sənaye biliyinə əsaslanır və real saytda yoxlanmalıdır.
- Rəqiblərin interfeysi tez dəyişir; kampaniya şərtləri (taksit sayı, faizlər) arxiv fraqmentlərindən götürülüb və köhnə ola bilər.

---

## 1. Sayt-sayt qısa cədvəl

### 1.1 Azərbaycan operatorları

| Sayt | Nə tapıldı (təsdiqlənmiş) | Axtarış forması / filtrlər / kart | Etibar, ödəniş, taksit | B2B / agent | Mənbə |
|---|---|---|---|---|---|
| **summertour.az** (Summer Tour Azerbaijan) | Şirkətin öz profil PDF-i: 2002-dən, Major Tourism Group-un üzvü, IATA akkreditasiyası, ATAA üzvü, ildə 60 000+ turist (öz iddiası). Türkiyə və Rusiyada da fəaliyyət. | yoxlanılmadı (sayt açılmadı) | IATA / ATAA üzvlüyü — profil iddiası | **Var:** "ilk milli B2B onlayn rezervasiya platforması", yerli turizm şirkətləri üçün, 500 000+ otelə çıxış (öz iddiası). Portal ünvanı və hansı proqram üzərində qurulduğu **tapılmadı**. Əlaqə: incomingaze@summertour.com | [1], [2] |
| **funsun.az** | Axtarışda `funsun.az` domeninə aid heç bir səhifə çıxmadı. `funsuntravel.com` adlı Azərbaycan bələdçi saytı var (əlaqəsi təsdiqlənmədi). Qeyd: "FUN&SUN" brendi Level.Travel-in operator siyahısında (Rusiya bazarı) görünür — AZ şirkəti ilə əlaqəsi **yoxlanılmadı**. | yoxlanılmadı | yoxlanılmadı | yoxlanılmadı | [3], [12] |
| **kompastravel.az / kompas.az** | Hər iki domen üçün axtarışda nəticə yoxdur. | yoxlanılmadı | yoxlanılmadı | yoxlanılmadı | — |
| **aristokrat.az** (Aristokrat Travel) | "Pay online and book your tour" — onlayn ödənişlə tur rezervasiyası; "Tour composer / Tur təşkil etmək" (tur konstruktoru) səhifələri; əsasən daxili (Azərbaycan) turlar, qiymət USD. | Tur konstruktoru (yoxlanılmadı: sahələr) | Onlayn ödəniş | yoxlanılmadı | [4] |
| **Silk Way Travel** | 2018 xəbəri: Summer Tour ilə birlikdə AZAL birbaşa reysi + 5* AI Antalya paketi satıb, digər turizm şirkətləri vasitəsilə də (köhnə məlumat). | — | — | Digər agentliklər vasitəsilə satış (2018) | [5] |
| **Silk Row Travel** | navigator.az profili: marşrut seçimi, otel, aviabilet, avtomobil icarəsini onlayn bron etmək imkanı. | yoxlanılmadı | yoxlanılmadı | yoxlanılmadı | [6] |
| **tourister.az, toursfrombaku.az** | Daxili ekskursiya operatorları: 40+ tur, 20–25 ₼-dan; bron sayt və ya WhatsApp ilə; hər tur səhifəsində "nə daxildir". | — | WhatsApp bron | — | [7] |
| **azerbaijan.travel** (Turizm Bürosu) | Tərəfdaş inteqrasiya proqramı: yoxlanılmış operator, təcrübə və yerləşmə müəssisələrini B2C kimi siyahılayır; rezervasiya və ödəniş tərəfdaşın öz saytında. | — | Dövlət "yoxlanılmış" statusu | B2C yönləndirmə | [8] |

### 1.2 Türkiyə OTA-ları

| Sayt | Axtarış / filtrlər | Nəticə kartı | Etibar, ödəniş, taksit | Konversiya fəndləri | B2B | Mobil | Mənbə |
|---|---|---|---|---|---|---|---|
| **tatilbudur.com** | Kateqoriya səhifələri: "Erken Rezervasyon Otelleri (510)" filtr başlığı ilə, "Son Dakika Fırsatları"; filtr seçimləri fraqmentlərdə görünmədi | Bir çox kartda "Fiyat için tarih seçmelisiniz" (qiymət üçün tarix seç) | **"Peşin Fiyatına 9 Taksit"** (bəzi otellərdə 3), **"Peşin Fiyatına Ek %3 İndirim"**, Worldcard endirimi; footer-də lisenziya: "Mika Turizm Belge No: 3073" | "Sepette ek %8'e varan indirim"; tarix üçün qiymət yoxdursa **"Seçtiğiniz tarih için sizi arayalım"** (geri zəng) | yoxlanılmadı | yoxlanılmadı | [9] |
| **jollytur.com** | "Ön ödemesiz oteller", "%50 ön ödemeli oteller" kampaniya kateqoriyaları; erkən rezervasiya səhifələri | yoxlanılmadı | **"Fiyat Farkı İade Garantisi"** — qalış tarixinə qədər saytda qiymət düşsə fərq qaytarılır (eyni otel/otaq/pansion/tarix; başqa firmaların qiyməti sayılmır); erkən rezervasiyada taksit, xaricdə taksit olmaya bilər (tək çəkim); %50 ön ödəniş rezervasiya anında; "Yurt içi erken rezervasyon seyahat güvence paketi" | Bank kartına xüsusi endirim (Garanti, Bonus %5), Miles&Smiles mil bonusu | Sat. acenteləri vasitəsilə satış qeyd olunur | yoxlanılmadı | [10] |
| **etstur.com** | yoxlanılmadı (yalnız otel səhifələri indeksdə) | Otel səhifəsində "Fiyat ve İndirimler" bölməsi | "Etstur yetkili satış acentesidir" ifadəsi; forс-major ləğv şərtləri açıq yazılıb. Taksit/pulsuz ləğv — yoxlanılmadı. Bakı otelləri də satılır (Hilton Baku, Holiday Inn Baku) | yoxlanılmadı | yoxlanılmadı | yoxlanılmadı | [11] |
| **enuygun.com** | Uçuş, otel, avtobus, avtomobil, transfer kateqoriyaları | Çox firmanın qiymətini bir yerdə müqayisə | yoxlanılmadı (taksit tapılmadı) | **Qiymət alarmı** (qiymət düşəndə bildiriş), geniş tarix aralığında **qiymət qrafiki**, **yalnız tətbiqə xas qiymətlər**, kart məlumatını saxlama, **sərnişin saxlama** | — | iOS/Android tətbiqi, push bildirişlər | [13] |
| **obilet.com, tatil.com** | Axtarışda bu domenlərə aid məlumat çıxmadı — **yoxlanılmadı** | | | | | | — |

### 1.3 Rusiya bazarı (tur müqayisəsi — TurTap-ın ən yaxın analoqları)

| Sayt | Model | Etibar, ödəniş | Konversiya | B2B / tərəfdaş | Mobil | Mənbə |
|---|---|---|---|---|---|---|
| **level.travel** | 20+ böyük operatorun (Coral, Sunmar, Biblio Globus, Anex, Pegas, Tez Tour, FUN&SUN, Intourist) təkliflərini müqayisə; tarix, qiymət, uçuş müqayisəsi, tam onlayn ödəniş. İstiqamət+şəhər+ay SEO səhifələri ("Туры в Баку летом 2026 из Москвы", "Горящие туры…", "…на двоих") | **"Гарантия лучшей цены — как у туроператора или ниже"**; PayLate ilə faizsiz 30/120 gün; **"Туры за 20% сейчас"** — 20% bronda, qalanı uçuşdan 17/25/33 gün əvvəl | "Горящие туры" bölməsi, bonus ballarla ödəniş haqqında məqalələr | Travelpayouts affiliate | iOS tətbiqi | [12], [14] |
| **travelata.ru** | 120+ operatoru real vaxtda müqayisə (Toolfox); operator filtri sol paneldə | Ödəniş sxemi seçimi: PayLate, Vanta, T-Bank "Доли" (hissələrlə); bəzi kampaniyalarda keşbek (5–7%, mənbələr fərqlənir) | Горящие туры | Travelpayouts affiliate; "МойАгент" | iOS tətbiqi | [15] |
| **onlinetours.ru** | ~100–130 operator (mənbələr fərqlənir); paket: uçuş+otel+transfer+sığorta | Rassrochka (PayLate və banklar), bronda 50% ödəyib qalanını 3 gündə ödəmək (bir mənbə) | Promokodlar | Travelpayouts affiliate | iOS tətbiqi | [16] |
| **Tourvisor** (B2B axtarış motoru) | 100+ operator, 30 000+ agent (Toolfox) | — | — | **Agentlər üçün:** brendli kolleksiyalar, "горящие" lenti, **Telegram bildirişləri**, **lead meneceri**, CRM üçün API; PRO tarif sorğu ilə, 10 gün sınaq. Köhnə qiymətlərə görə 2 operatoru nəticələrdən çıxarıb (operator API-ləri gec yenilənirdi) | iOS tətbiqi | [17] |

### 1.4 Qlobal platformalar

| Sayt | Əsas funksiyalar (təsdiqlənmiş) | Etibar / konversiya | B2B / API | Mənbə |
|---|---|---|---|---|
| **booking.com** | Real vaxt mövcudluq; "yalnız X otaq qaldı" mesajı müəyyən hədddən aşağıda göstərilir | Təcili/qıtlıq mesajları **tənqid və məhkəmə iddialarının mövzusudur** (UK CMA, Hollandiya kollektiv iddiası) — ehtiyatla kopyalanmalı. Genius, "pulsuz ləğv", "ön ödənişsiz" — bu sessiyada **yoxlanılmadı** | **Demand API**: Managed Affiliate Partner statusu + imzalı müqavilə + hesab meneceri tələb olunur; axtarış icazəsi ≠ rezervasiya icazəsi | [18], [19] |
| **skyscanner** | **"Everywhere"** (hər yerə, ucuzdan bahaya), **"Cheapest month"** görünüşü; Everywhere qiymətləri son 8 gün, Whole Month son 4 gün ərzində tapılmış qiymətlərdir (şəffaflıq qeydi); **Price Alerts** | Qiymətin "nə vaxt tapıldığını" açıq deyir | yoxlanılmadı | [20] |
| **aviasales** | Aşağı qiymətlər təqvimi, qiymət xəritəsi/qrafiki, çevik tarixlər, mürəkkəb marşrut, qiymət izləmə | Təqvim vidjeti konversiyanı +36% artırıb (şirkət iddiası) | **Travelpayouts**: data API qeydiyyatdan sonra; axtarış API sorğu ilə | [21] |
| **kiwi.com** | "Virtual interlining" (fərqli aviaşirkət biletlərini birləşdirmək, özün transfer) | "Kiwi.com Guarantee" — gecikmə/ləğv halında (ikinci dərəcəli mənbə) | yoxlanılmadı | [20] |
| **rentalcars.com** | **yoxlanılmadı** (axtarışda məlumat çıxmadı) | | | — |
| **localrent.com** | Bakı üçün yoxlanılmış yerli icarəçilər; **"aşağı depozit / depozitsiz" filtri**, seçilmiş ünvana çatdırılma; qiymətə vergi və sığorta daxil | Kredit kartsız/depozitsiz maşınlar (RU icmal) | yoxlanılmadı | [22] |
| **getyourguide** | Partner API (REST/JSON, token), OpenAPI spec GitHub-da; təchizatçı Connectivity API | "Reserve now pay later", "24 saat əvvəl pulsuz ləğv" — **yoxlanılmadı** | Affiliate: satış faizi (~8%, mənbələr fərqli); Travelpayouts vasitəsilə də | [23] |
| **tripadvisor** | Filtrlər: qiymət, imkanlar, obyekt növü, məsafə + xəritə; "View Deal" → otel saytına/OTA-ya yönləndirmə (metaaxtarış) | **Travellers' Choice** mükafatı — rəylərin keyfiyyəti və sayı əsasında | Business Center | [24] |

---

## 2. TurTap-da olmalı funksiyalar

`docs/PLAN.md`-də artıq olanlar (qiymət xəbərdarlığı, qiymət tarixçəsi, çevik tarix təqvimi, taksit ödənişi, B2B abunə, viza məlumatı, rəylər/şəkillər, Telegram/WhatsApp bot, SEO səhifələri) burada **təkrarlanmır**; yalnız onları konkretləşdirən bəndlərdə istinad edilir.

### P1 — MVP-yə indi əlavə edilməli (demo məlumatla edilə bilər)

| # | Funksiya | Haradan gördüm | Niyə faydalı | Tətbiq qeydi |
|---|---|---|---|---|
| 1 | **"Hara gedə bilərəm?" — istiqamətsiz büdcə axtarışı.** İstiqamət boş qalanda, büdcəyə sığan bütün istiqamətlər ən ucuz təkliflə ucuzdan bahaya kart kimi göstərilir | Skyscanner "Everywhere" [20] | Bizdə büdcə sahəsi artıq var — bu onu əsas fərqləndiriciyə çevirir; AZ istifadəçisi tez-tez "3000 ₼-a hara?" deyə düşünür | `search.js`: `dest` boşdursa hər destination üçün min qiymət; frontend-də istiqamət kartları |
| 2 | **Kartda aylıq ödəniş və ilkin ödəniş göstəricisi:** "≈ 350 ₼/ay × 6", "İndi 20% (X ₼), qalanı uçuşdan əvvəl"; tam ödənişə əlavə endirim nişanı | tatilbudur "Peşin fiyatına 9 taksit" + "Peşin fiyatına ek %3 indirim" [9]; level.travel "Туры за 20% сейчас" [14]; jollytur %50 ön ödəniş [10] | PLAN #4 (taksit) ideyasının **vitrin hissəsi** — bank inteqrasiyası olmadan da kartda göstərmək konversiyanı artırır; böyük məbləği "aylıq"a bölmək qərarı asanlaşdırır | Operator/təklif üzrə `installmentMonths`, `prepayPct` demo sahələri; kalkulyator frontend-də |
| 3 | **Ləğv və ön ödəniş şərtləri: nişan + filtr** — "Ön ödənişsiz", "50% ön ödəniş", "Pulsuz ləğv X tarixədək" | jollytur "Ön ödemesiz oteller", "%50 ön ödemeli" [10]; localrent depozit filtri [22]; booking (yoxlanılmadı) | Erkən rezervasiyada (aylar qabaq) əsas qorxu — puldan olmaq; şərti əvvəlcədən göstərmək etibar yaradır | Təklifə `cancellation: {freeUntil, prepayPct}`; filtrlərə checkbox |
| 4 | **"Son dəqiqə" (горящие/son dakika) bölməsi/filtri** — yaxın 14 gündə uçuş, endirim faizi ilə | tatilbudur "Son Dakika Fırsatları" [9]; level.travel, travelata "Горящие туры" [12][15]; Tourvisor "горящие" lenti [17] | Erkən rezervasiya nişanımızın simmetrik cütü; ən çox axtarılan seqmentlərdən biri, SEO üçün də ayrıca səhifə | `checkIn` yaxındırsa `lastMinute` nişanı; tab/filtr |
| 5 | **Qiymət aktuallığı və mənbə şəffaflığı** — hər qiymətin yanında "operatordan X dəq/saat əvvəl yoxlanılıb", köhnəlibsə xəbərdarlıq və "Yenilə" | Skyscanner qiymətin nə vaxt tapıldığını açıq deyir [20]; Tourvisor köhnə qiymətə görə operatorları çıxarıb [17] | Müqayisə saytının ən böyük riski — saytdakı qiymət ilə operatorun real qiyməti fərqlənəndə etibar itir; operatorlarla danışıqlarda da arqumentdir | Provider cavabına `fetchedAt`; kartda nisbi vaxt; keş TTL |
| 6 | **Operator etibar bloku** — kartda/modalda operatorun lisenziya nömrəsi, ATAA/IATA üzvlüyü, fəaliyyət ili, əlaqə | tatilbudur footer "Belge No: 3073" [9]; etstur "yetkili satış acentesi" [11]; Summer Tour IATA/ATAA [1]; azerbaijan.travel "yoxlanılmış tərəfdaş" [8] | İstifadəçi pulu TurTap-a yox, operatora ödəyir — operatorun etibarlı olduğunu göstərmək lazımdır; xarici bazarda (beynəlxalq hədəf) xüsusilə vacib | `config.js`/provider metadata-ya `license`, `memberships`; demo dəyərlər "DEMO" kimi işarələnsin |
| 7 | **Uşaq yaşları sahəsi** — hər uşaq üçün yaş seçimi (0–17) | Paket tur qiymətləndirməsində standart (bu sessiyada konkret saytda **yoxlanılmadı**) | Hazırda yalnız uşaq sayı var; real operator qiyməti uşağın yaşından asılıdır (0–2 pulsuz, 2–12 endirim) — real API-yə keçəndə mütləq lazım olacaq, indidən UI-da olsun | Form-da dinamik select-lər; `search.js`-də yaşa görə demo qiymət əmsalı |
| 8 | **"Sizə zəng edək / Menecer qiyməti dəqiqləşdirsin"** — nəticə yoxdursa və ya tarix seçilməyibsə, kartda geri zəng düyməsi (mövcud lead formasına bağlı) | tatilbudur "Seçtiğiniz tarih için sizi arayalım" [9] | Boş nəticə = itirilmiş istifadəçi; AZ bazarında telefon/WhatsApp ilə satış hələ də dominantdır (tourister/toursfrombaku WhatsApp bron [7]) | Mövcud "Müraciət et" formasını boş vəziyyət və kart səviyyəsində çağırmaq |
| 9 | **B2B: brendli seçim linki** — menecer seçdiyi variantlardan agentliyin loqosu/adı ilə paylaşılan səhifə yaradır (operator adı gizli), müştəri linkdə "Bu variantı istəyirəm" basır → lead menecerə qayıdır | Tourvisor agentlər üçün "brendli kolleksiyalar" və "lead meneceri" [17] | Hazırkı WhatsApp mətnindən güclüdür: şəkil, qiymət, şərtlər bir səhifədə; agentliklər üçün abunə dəyərini (PLAN #5) artırır | `/b2b/share/:id` — seçimlər + komissiya ilə qiymət JSON-da saxlanır (demo: yaddaşda) |
| 10 | **Ödəniş üsulları və təhlükəsizlik zolağı** — footer/kartda qəbul olunan üsullar (kart, taksit kartları, nağd ofisdə), "Ödəniş birbaşa operatora" izahı | tatilbudur/jollytur bank kartı kampaniyaları [9][10]; travelata ödəniş sxemi seçimi [15] | Müqayisə saytında "pulu kimə ödəyirəm?" sualı əsas maneədir; sadə izah çaşqınlığı aradan qaldırır | Statik komponent + i18n (AZ/EN/RU) |

### P2 — növbəti mərhələ

| Funksiya | Haradan | Niyə |
|---|---|---|
| **Qiymət fərqi zəmanəti** ("rezervasiyadan sonra eyni operatorda qiymət düşsə, fərqi qaytarırıq") | jollytur "Fiyat Farkı İade Garantisi" [10]; level.travel "гарантия лучшей цены" [14] | Güclü etibar elementi, amma operatorlarla hüquqi razılaşma tələb edir |
| **Tətbiqə/hesaba xas qiymətlər, saxlanmış sərnişinlər, saxlanmış kart** | enuygun [13] | Təkrar alışı sürətləndirir; hesab sistemi (PLAN 6.4) gələndən sonra |
| **Bank kartı kampaniyaları və keşbek/mil bonusu** (Birbank, Kapital və s. ilə tərəfdaşlıq) | jollytur Bonus/Miles&Smiles [10]; travelata keşbek [15] | AZ banklarının taksit kartları ilə birgə kampaniya — PLAN #4-ün davamı. Birbank-ın səyahət üzrə taksit proqramı axtarışda **tapılmadı** [25] — birbaşa soruşulmalı |
| **B2B: Telegram bildirişləri** — yeni lead, qiymət düşməsi, yeni erkən rezervasiya | Tourvisor [17] | Menecerlər Telegram/WhatsApp-da yaşayır |
| **B2B: CRM üçün API / webhook** | Tourvisor API [17] | Böyük agentliklər öz CRM-lərinə lead ötürmək istəyəcək |
| **Affiliate inteqrasiyalar** — ekskursiyalar üçün GetYourGuide Partner API, otellər üçün Booking Demand API, aviabilet modulu üçün Travelpayouts | [19], [21], [23] | Öz inventarı olmayan bölmələri tez doldurmaq; diqqət: Booking Demand API Managed Affiliate statusu tələb edir |
| **Xəritə görünüşü** (otellər xəritədə, məsafə filtri) | Tripadvisor [24] | Kurort seçimində (Lara vs Kemer) vacibdir |
| **Avtomobil modulu üçün "depozitsiz / aşağı depozit" və "qiymətə sığorta daxil" filtri** | localrent [22] | Bakıda icarəçilərin çoxu depozit istəyir [22] — paralel komanda üçün qeyd |
| **Paket qurucusu: tur + ekskursiya + transfer + avto bir səbətdə** | aristokrat.az "Tour composer" [4]; enuygun çox kateqoriya [13] | Aviabilet və avto modulları hazır olanda çarpaz satış |
| **"Ailə üçün", "Cütlüklər üçün" etiketləri və mükafat nişanları** ("TurTap seçimi" — rəy sayı və balına görə) | Tripadvisor Travellers' Choice [24] | Seçimi sadələşdirir; PLAN #7 (rəylər) gələndən sonra |

### P3 — uzunmüddətli

| Funksiya | Haradan | Niyə / qeyd |
|---|---|---|
| Mobil tətbiq (push, tətbiqə xas qiymət) | level.travel, travelata, onlinetours, Tourvisor, enuygun — hamısının iOS tətbiqi var [13]–[17] | Əvvəlcə PWA kifayətdir |
| Öz "TurTap zəmanəti" (uçuş+otel ayrı alınanda gecikmə/ləğv qorunması) | Kiwi.com Guarantee [20] | Sığorta/hüquqi baza tələb edir |
| Bonus/loyallıq balları ilə ödəniş | level.travel bonus məqaləsi [14] | Böyük həcm olanda mənalıdır |
| Qıtlıq/təcili mesajlar ("yalnız 2 yer qaldı") | Booking.com [18] | **Yalnız real məlumatla**; saxta qıtlıq UK CMA və Avropada hüquqi problem yaradıb [18] — demo məlumatla etmək olmaz |

---

## 3. Operator inteqrasiyası üzrə tapıntılar

### 3.1 Nə təsdiqləndi
- **Summer Tour Azerbaijan** öz profilində "ilk milli B2B onlayn rezervasiya platforması"na sahib olduğunu, yerli turizm şirkətlərinin onu istifadə etdiyini və 500 000+ otelə çıxış verdiyini yazır [1][2]. Deməli agent girişi **mövcuddur**, amma portalın ünvanı, hansı proqramla qurulduğu (SAMO, Megatec Master-Tour, öz sistemi və s.) və açıq API olub-olmadığı **tapılmadı**. Əlaqə: incomingaze@summertour.com [1].
- Summer Tour-un Türkiyə və Rusiyada da şirkətləri var [2] — Türkiyə tərəfində API ola bilər (yoxlanılmadı).
- 2018-də Silk Way Travel Summer Tour paketlərini digər agentliklər vasitəsilə satırdı [5] — bazarda operator → agentlik topdan satış modeli var.

### 3.2 Nə yoxlanılmadı (sübut tapılmadı — təxmin etmirik)
- **Funsun, Kompas**: rəsmi saytları açılmadı, axtarışda domenlərinə aid səhifə çıxmadı. Rezervasiya sistemi, B2B portal, API haqqında **heç bir məlumat yoxdur**.
- **SAMO-tour, Paximum/San TSG, Sejour, Tourvisor**: Azərbaycan operatorları ilə bağlı heç bir axtarış nəticəsində bu sistemlərin adı çıxmadı. Bu, istifadə etmədikləri demək **deyil** — sadəcə açıq mənbədə iz yoxdur və səhifə mənbəyinə baxmaq mümkün olmadı.
- Tourvisor-un Bakıdan uçuşları dəstəklədiyi **təsdiqlənmədi** (RU axtarışında yalnız Rusiya şəhərlərindən Bakıya turlar çıxdı) [17].

### 3.3 Növbəti addımlar (tövsiyə)
1. Sessiyanın şəbəkə ayarlarında `summertour.az`, `funsun.az`, `kompastravel.az` (və real domenlər) icazəli edilsə, səhifə mənbəyi (`<script src>`, `/b2b`, `/agent`, `samo`, `tourvisor`, `paximum`, `api` sözləri) yenidən yoxlanıla bilər.
2. Hər operatora birbaşa sual siyahısı (PLAN 3.1 ilə uyğun): (a) hansı rezervasiya sistemi; (b) agent XML/JSON API varmı, sənəd; (c) sınaq (sandbox) girişi; (d) qiymət yenilənmə tezliyi (bizim P1 #5 üçün); (e) uşaq yaşı, ləğv və ön ödəniş şərtləri API-də gəlirmi (P1 #3, #7 üçün); (f) komissiya modeli.
3. Rusiya bazarında operatorların açıq API kanalı var və Tourvisor kimi motorlar ondan istifadə edir [17] — AZ operatorlarının RU/TR baş şirkətləri (məs. Summer Tour Türkiyə) eyni kanalı təklif edə bilər; danışıqlarda soruşulmalı.
4. Otellər və ekskursiyalar üçün ehtiyat yol: Booking Demand API (Managed Affiliate müqaviləsi lazımdır) [19], GetYourGuide Partner API [23], Travelpayouts (Aviasales, GetYourGuide, level.travel, travelata, onlinetours proqramları bir yerdə) [21].

---

## 4. Mənbə linkləri

1. Summer Tour Azerbaijan profil PDF — https://profile.summertour.az/files/Summer%20Tour%20Azerbaijan%20(EN).pdf
2. Summer Tour haqqında RU sənaye məqaləsi (köhnə) — https://www.tourdom.ru/hotline/strategii-kompaniy/tury-v-azerbaydzhan-kto-snimaet-slivki/
3. Fun & Sun Travel bələdçisi — https://www.funsuntravel.com/Things-to-do-in-azerbaijan
4. Aristokrat Travel — https://aristokrat.az/en/blog/baku-tour-operator ; https://old.aristokrat.az/en/tours/baku-sightseeing-tour
5. Azernews, Silk Way Travel + Summer Tour (2018) — https://www.azernews.az/travel/126072.html
6. Silk Row Travel, navigator.az — https://navigator.az/en/firm/31426
7. Tourister / Tours from Baku — https://www.expat.com/en/business/143395_tourister.html ; https://www.expat.com/en/business/143394_tours-from-baku.html
8. Azərbaycan Turizm Bürosu tərəfdaş proqramı — https://tourismboard.az/page/1743-partner-integration-program ; https://azerbaijan.travel/how-to-plan/plan-your-trip/book-your-trip-en
9. tatilbudur — https://www.tatilbudur.com/erken-rezervasyon-otelleri ; https://www.tatilbudur.com/son-dakika-firsatlari ; https://www.tatilbudur.com/erken-rezervasyon-antalya-otelleri
10. jollytur — https://www.jollytur.com/fiyat-farki-iade-garantisi ; https://www.jollytur.com/on-odemesiz-oteller-kampanya-kosullari ; https://www.jollytur.com/yuzde-50-on-odemeli-oteller-kampanya-kosullari ; https://www.jollytur.com/yurt-ici-erken-rezervasyon-seyahat-guvence-paketi ; https://www.jollytur.com/miles-smiles-kredi-kartlarina-ozel-4000-mil-puan-ayricaligi
11. etstur otel səhifələri — https://www.etstur.com/Hilton-Baku ; https://www.etstur.com/Holiday-Inn-Baku-By-Ihg-9604288
12. level.travel Azərbaycan səhifələri və App Store — https://level.travel/explore/Moscow-Russia/Baku-Azerbaijan/hot ; https://apps.apple.com/ru/app/level-travel-%D1%82%D1%83%D1%80%D1%8B-%D0%B8-%D0%BE%D1%82%D0%B5%D0%BB%D0%B8/id1343228721
13. enuygun App Store və haqqında — https://apps.apple.com/hr/app/enuygun-u%C3%A7ak-otel-otob%C3%BCs-ara%C3%A7/id669210250?l=hr ; https://www.enuygun.com/hakkinda/
14. Rassrochka icmalları — https://www.sostav.ru/blogs/287374/110880 ; https://vc.ru/id3504730/2985782-oplata-tura-chastyami ; https://level.travel/media/tour-searching-filters/
15. travelata — https://toolfox.ru/services/s/travelata ; https://intercom.help/travelata-ac8575273330/ru/articles/6791292-наши-преимущества ; https://www.travelpayouts.com/ru/offers/travelata-partnerskaya-programma/
16. onlinetours — https://www.onlinetours.ru/about ; https://uniticket.ru/blog/onlinetours-ru/ ; https://howtrip.ru/tury-v-rassrochku-stoit-brat-i-gde-luchshe/
17. Tourvisor — https://toolfox.ru/services/s/tourvisor ; https://www.tourdom.ru/news/tourvisor-ru-isklyuchil-dvukh-turoperatorov-iz-poiskovoy-vydachi-iz-za-neaktualnykh-tsen.html
18. Booking.com qıtlıq mesajları və iddialar — https://www.ionos.com/digitalguide/websites/web-development/what-are-dark-patterns.md ; https://gulfnews.com/travel/only-one-room-left-bookingcom-faces-massive-lawsuits-over-anti-competitive-practices-market-abuse-deceptive-pricing-fabricated-scarcity-tactics-1.500230124 ; https://landingdoctors.com/teardowns/booking-com
19. Booking.com Demand API ilkin şərtləri — https://developers.booking.com/demand/docs/getting-started/prerequisites
20. Skyscanner / Kiwi — https://www.skyscanner.com/tips-and-inspiration/how-to-find-flight-deals ; https://www.skyscanner.com/flights ; https://finder.com.au/sites-like-skyscanner
21. Aviasales / Travelpayouts — https://www.travelpayouts.com/ru/blog/aviasales-widget-update/ ; https://www.travelpayouts.com/ru/blog/brands-api/
22. Localrent və Bakı icarə bazarı — https://localrent.com/en/azerbaijan/baku ; https://www.vipcars.com/car-rental/azerbaijan/baku
23. GetYourGuide Partner/Connectivity API — https://getyourguide.supply/connectivity/connectivity-partners ; https://travelpayouts.com/en/offers/getyourguide-affiliate-program
24. Tripadvisor — https://paigemindsthegap.com/?p=8586 ; https://www.tripadvisor.com/hotels
25. Birbank "Səyahət marafonu" kampaniyası — https://birbank.az/en/news/birbank-in-s-yah-t-marafonu-kampaniyasi-il-duenyani-k-sf-edin

**Açılmayan / məlumat tapılmayan:** summertour.az (ana səhifə), funsun.az, kompastravel.az, kompas.az, etstur.com (birbaşa), obilet.com, tatil.com, rentalcars.com — bu sessiyada yoxlanılmadı.
