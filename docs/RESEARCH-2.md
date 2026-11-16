# TurTap — araşdırma 2: aviabilet, otel və qanuni qiymət mənbələri

Tarix: 2026-11-16. Hazırlayan: məhsul analitiki (AI köməkçi). Davamıdır: `docs/RESEARCH.md` (1-ci araşdırma),
`docs/PLAN.md`, `docs/FLIGHTS.md`, `docs/CARS.md`, `docs/OPERATORS-SAMO.md`.

## 0. Metodologiya və məhdudiyyətlər

- **Avtomatik qiymət çəkmə, axtarış sorğularının avtomatlaşdırılması, anti-bot qorumasını keçmə edilmədi.** Yalnız ictimai
  səhifələr (ana səhifə, kömək/FAQ, "How we work", robots.txt) adi şəkildə, bir dəfə açıldı. Axtarış nəticə səhifələri
  açılmadı (Kayak/Cheapflights/Skyscanner `robots.txt`-də `/flights/`, `/hotels/` bağlıdır).
- Playwright ilə açılan səhifələrin mətni və ekran şəkilləri: `/tmp/claude-0/-home-user-Turizm-Sayti---online-/4a5905cc-a849-5d27-9689-34197281e5cc/scratchpad/r2-*.txt|png`
  (müvəqqəti qovluq; Kayak-ın CSS faylları yüklənmədi, ona görə şəkillər üslubsuzdur, mətn tamdır).
- **Bloklar (orada dayanıldı, təkrar cəhd edilmədi):**
  | Sayt | Nə baş verdi |
  |---|---|
  | **www.azal.az, azal.az** | Cloudflare "Just a moment… / Performing security verification" (HTTP 403) — həm curl, həm Playwright. Sayt **açılmadı**. `help.azal.az` sessiyanın şəbəkə siyahısında yoxdur (DNS bloku). |
  | **www.skyscanner.net** | Ana səhifə əvəzinə captcha ("Are you a person or a robot?"). **Açılmadı.** |
  | **www.booking.com** | Ana səhifə açıldı (HTTP 202, mətn alındı). "How we work", Genius, Affiliate səhifələri 403 "detected as a robot" qaytardı — **dayanıldı**. |
  | **www.kayak.com, www.cheapflights.com** | Açıldı: ana səhifə (desktop + mobil), Explore, Airfare Trends, Help: Pricing & Price Alerts, How we work, Airline fees; Cheapflights "Search by date". |
- Qalan faktlar **web axtarış nəticələrindən** (rəsmi kömək səhifələri, rəsmi xəbərlər, sənədlər; üçüncü tərəf mənbələri ayrıca qeyd olunub).
  **"yoxlanılmadı"** = bu sessiyada heç bir mənbədə təsdiq tapılmadı. Partnyor/API şərtləri tez dəyişir — müqavilədən əvvəl yenidən yoxlanmalıdır.

### Artıq mövcud olanlar (təkrarlanmır)
Aviabilet: ±3 gün qiymət təqvimi, ucuz/sürətli/ən yaxşı sıralama, aktarma/saat/aviaşirkət/baqaj/maks. qiymət filtrləri,
tarif ailələri (baqajlı/baqajsız, qaytarılma), çox hava limanlı şəhərlər, paylaşılan link, agent rejimi, müraciət forması.
Tur/otel: "Hara gedə bilərəm?", son dəqiqə, ilkin ödənişsiz/pulsuz ləğv filtrləri, qiymət təzəliyi, operator etibar bloku,
uşaq yaşları, geri zəng, taksit vitrini, otel reytinqi (DEMO, 7.4–9.7) və reytinqə görə sıralama.
PLAN #1–#9 (qiymət xəbərdarlığı, qiymət tarixçəsi, çevik təqvim, taksit, viza, rəylər, bot, SEO) — aşağıda yalnız konkretləşdirilir.

---

## (a) Sayt-sayt tapıntılar

### A1. AZAL (Azerbaijan Airlines) — sayt açılmadı, yalnız ictimai mənbələr

| Mövzu | Tapıntı | Status / mənbə |
|---|---|---|
| Bilet axtarış forması, qiymət təqvimi | Sayt Cloudflare yoxlamasına görə açılmadı. azal.az-da "aşağı qiymət təqvimi" olub-olmadığına dair mənbə tapılmadı. | **yoxlanılmadı** |
| Tarif ailələri (ekonom) | Axtarış nəticələrinə görə üç pillə: **Budget/Promo** (pulsuz qeydiyyat baqajı yox), **Classic** (1×23 kq), **Plus** (32 kq); əl yükü 10 kq, 55×40×23 sm. AZAL-ın öz "first-time travelers" bloq səhifəsi 23/32 kq və 10 kq-ı təsdiqləyir; "Budget" adı köhnə (2016) rəsmi xəbərdədir; Premium Economy 2024-02-01-dən var. Dəyişmə/qaytarma şərtləri AZAL kömək mərkəzinə görə **tarif seçilərkən göstərilir**. | Qismən təsdiq [1][2][3]; dəqiq dəyişmə/qaytarma cərimələri **yoxlanılmadı** |
| Mükafat biletləri | AZAL Miles: "Budget" mükafat bileti qaytarılmır/dəyişdirilmir; Classic/Premium/Business — fərq + 60 EUR cərimə ilə. | rəsmi səhifə fraqmenti [4] |
| Bonus proqramı | **AZAL Miles** — 2024-09 yenilənib: Classic, Silver, Gold, Platinum, Elite (1 EUR = 2…6 mil); ilk uçuşa 300 mil; ABB ilə ko-brend kart; 2026-10 Comarch ilə tətbiqdə QR (partnyorlarda mil qazanma/xərcləmə). | [5][6][7] |
| Ödəniş | ABB **TamKart** ilə 2–3 ay taksit (azal.az və tətbiq). | 2024 rəsmi xəbər [8]; hazırkı vəziyyət **yoxlanılmadı** |
| Check-in | Onlayn check-in pəncərəsi mənbələrdə fərqlidir (24 və ya 48 saat). | ziddiyyətli, **yoxlanılmadı** [9] |
| Naxçıvan reysləri | Bakı–Naxçıvan 2026-03-05 hadisəsindən sonra dayandırılıb, **2026-03-09-dan bərpa**; iyunda ən yüklü daxili marşrut. 2022 Nazirlər Kabineti qərarı: bu marşrutlarda tarif **60 AZN**, bir sıra kateqoriyalara güzəşt; satış NMR-in Bakıdakı Daimi Nümayəndəliyinin verdiyi siyahı əsasında aparılıb; bayramlarda AZAL erkən almağı tövsiyə edir. 2026 üçün qüvvədə olan tarif **yoxlanılmadı**. | [10][11][12] |
| B2B / agent / NDC | Ayrıca ictimai agent portalı **tapılmadı**. Agent kanalları: **Travelport+** məzmun müqaviləsi (2025-02 yenilənib, əlavə xidmətlərlə) və **Accelya FLX Select ilə NDC** (2026-01 elan; agentlik və onlayn platformalar üçün). | [13][14] |

**TurTap üçün nəticə:** AZAL-ın tarif strukturu (Budget/Classic/Plus) bizim demo "baqajlı/baqajsız" ailələrinə uyğundur, amma
real qiymət yalnız GDS (Travelport), NDC (Accelya vasitəsilə) və ya aqreqator ilə gələ bilər. Naxçıvan marşrutu xüsusi
qaydalı olduğundan adi müqayisə məntiqi ilə göstərilməməlidir.

### A2. Kayak (açıldı) və Cheapflights (açıldı; Kayak ilə eyni qrup — eyni robots.txt və footer)

| Funksiya | Tapıntı | Mənbə |
|---|---|---|
| Axtarış forması | Gediş-dönüş seçimi, **"0 bags" — baqaj sayı birbaşa formada**, sərnişin + sinif bir sahədə; menyuda Explore, Airfare Trends, Monthly Flight Deals, Flight Tracker, "Plan with AI / Ask AI". | r2-kayak-home [15] |
| "Ən yaxşı" sıralama | Default "Best/Recommended" qiymət və rahatlığı balanslaşdırır: müddət, qiymət, məsafə, sərnişin sayı, axtarışa necə başlanıb; **müxtəliflik məntiqi** (fərqli aviaşirkət və saatlar); **dinamik çəki** ("ən ucuz cüzi ucuz, amma xeyli uzundursa, qiymətin çəkisi azalır"). Eyni uçuşu bir neçə satıcı verirsə — **ən ucuz satıcı həmişə vurğulanır**, bərabər qiymətlilər CTR/CPC ilə sıralanır; ödənişləri gizlədən satıcılar az tövsiyə olunur; sponsorlu nəticələr həmişə işarəlidir. | How we work [16] |
| Hacker Fares | İki ayrı birtərəfli bileti (fərqli aviaşirkətlər) birləşdirib göstərir, ucuz olanda. | [16] |
| Qiymət xəbərdarlığı | Uçuş nəticəsində "Track prices" düyməsi, otelda "Set Price Alert", istənilən nəticədə ürək/çanta ikonu; limit yoxdur; **gündəlik toplu e-poçt/push** + "real vaxt" rejimi (**~10% dəyişiklikdə**); uçuş tarixi keçəndə və ya e-poçt açılmayanda bitir (əvvəlcədən xəbərdarlıq). | Help: Pricing [17] |
| Qiymət proqnozu | Növbəti 7 gün üçün "artacaq/düşəcək", **"buy now / wait"** tövsiyəsi + **etibar səviyyəsi**; dəqiqliyi gündəlik ölçülür; **yalnız gediş-dönüş** və kifayət qədər tarixi məlumat olan marşrutlarda göstərilir. | [17] |
| Baqaj/ödəniş | Qiymətə vergi daxildir, baqaj daxil deyil; **Fee Assistant** baqaj və ödəniş haqqını təxmini əlavə edib ümumi qiyməti göstərir; çanta ikonunda tarif/vergi bölgüsü; **Airline fees** cədvəli (AZAL üçün yalnız "aviaşirkət saytına baxın"). | [17][18] |
| Explore | Büdcə və tarixə görə istiqamətlər + xəritə; filtrlər: aktarma, qiymət, uçuş müddəti, səfər növü. Açıq qeyd: "qiymətlər son axtarışlara əsasən təxminidir, 1 nəfər, gediş-dönüş, ekonom, vergi daxil, baqaj daxil olmaya bilər". | r2-kayak-explore [19] |
| Airfare Trends | Həftəlik orta qiymət paneli (həftə-həftə, il-il), metodologiya açıq yazılıb. | [20] |
| Cheapflights | "Compare To" — **4-ə qədər satıcını yan-yana** açıb müqayisə; "Search by date"; 300+ partnyor; xəbər bülleteni; "* bütün qiymətlər mövcudluğa bağlıdır". | r2-cheap-home, r2-cheap-bydate [21] |
| Mobil | Mobil versiyada da Explore/Trends menyusu; tətbiqdə Price Trend qrafiki nəticələrin başında. | [17] |
| Etibar | "How we work" səhifəsi (sıralama, sponsorluq, məlumat əhatəsi), mükafatlar, təhlükəsizlik (HackerOne). | [16] |

### A3. Skyscanner — sayt captcha göstərdi; ictimai məqalələr

| Funksiya | Tapıntı | Mənbə |
|---|---|---|
| Everywhere | İstiqamət yerinə "Everywhere" — ölkələr ucuzdan bahaya; ölkə/şəhər seçəndən sonra Price Alert qurmaq olar. | [22] |
| Whole month / Cheapest month | "Flexible dates" → bütün ay; "Cheapest month" seçimi; çevik axtarışlarda yalnız ekonom (üçüncü tərəf). Everywhere qiymətləri son 8 gün, ay görünüşü son 4 gün ərzində tapılmış qiymətlərdir (1-ci araşdırma). | [22][23], RESEARCH.md [20] |
| Sıralama | Best (sürət + qiymət), Cheapest, Fastest, gediş/dönüş saatı. | üçüncü tərəf [23] |
| Self-transfer | Fərqli aviaşirkətlərin ayrı biletlərini bir marşrutda göstərir; partnyor siyasətinin 13-cü bəndi self-transfer təkliflərinə tələb qoyur; aktarma qorunmur (gecikmədə aviaşirkət məsuliyyət daşımır). | [24][25] |
| Nə vaxt almalı | Savings Generator, "tarixi qiymətdən ucuz" xəritə işarəsi. | Skyscanner məqaləsi [26] |
| Partnyor | Affiliate — Impact platforması (link, banner, axtarış forması); **Travel API ayrıca, əl ilə təsdiq**, böyük partnyorlar üçün. | [27] |

### A4. Booking.com — ana səhifə açıldı, qalan səhifələr 403

| Mövzu | Tapıntı | Status |
|---|---|---|
| Axtarış forması | "Find your next stay", **"Search in your own words"** (təbii dil axtarışı), tarix aralığı, "2 adults · 0 children · 1 room", "I'm travelling for work". Uşaq yaşı seçimi — **yoxlanılmadı** (forma açılmadı). | r2-booking-home (təsdiq) |
| Ana səhifə etibar blokları | "Book now, pay at the property", "FREE cancellation on most rooms", "300M+ reviews", "2+ million properties", "24/7 customer service"; Late Escape Deal (15%+), Black Friday; Genius bloku ("Save 10% or more… blue Genius label"); obyekt növləri (hotel, apartament, villa…); footer-də "How we work", "Booking.com for Travel Agents", Traveller Review Awards. | təsdiq |
| Sıralama | Default "**Our top picks**" (tətbiqdə "Popularity"); ödənişli yerləşdirmə "**Ad**" nişanı ilə. | rəsmi "How we work" fraqmenti [28] |
| Rəy balı | 1–10 şkala (2019-20-də 2.5–10-dan keçib), son 3 ilin rəyləri, yeniləri daha çox çəkili; alt kateqoriyalar ümumi bala təsir etmir. Söz etiketləri ("Superb 9+", "Very good" və s.) — dəqiq hədlər **yoxlanılmadı**. | [29] |
| Genius | 1-ci səviyyə 10% (hesab açmaq kifayət), 2-ci — 2 ildə 5 rezervasiya (10–15%), 3-cü — 2 ildə 15 (20%-ə qədər). | üçüncü tərəf + rəsmi fraqment [30] |
| Filtrlər (qiymət histoqramı, rayon, məsafə, olanaqlar, pulsuz ləğv, ilkin ödənişsiz), nəticə kartı, otel səhifəsi (qalereya, otaq cədvəli, qaydalar, xəritə, rəylər), xəritə görünüşü | Nəticə və otel səhifələri açılmadı. Ümumi bilik kimi mövcuddur, amma bu sessiyada **yoxlanılmadı**. | yoxlanılmadı |
| Qıtlıq mesajları | UK CMA 2019 öhdəlikləri (təzyiqli satış, yanıltıcı endirim); Which? yoxlaması: "only X room left" iddialarının 5/10-u real mövcudluğu əks etdirmirdi; Agoda "bu qiymətə 1 qaldı" formatına keçib. AB-də Booking **DMA "gatekeeper"** (2024-05-13). | [31][32] |
| Affiliate | 2025-dən birbaşa affiliate proqramı şəbəkələrə köçürülüb (mənbələrdə CJ və ya Awin — ziddiyyətli). Demand API — Managed Affiliate + müqavilə. | [33], RESEARCH.md [19] |

---

## (b) TurTap üçün tövsiyə olunan funksiyalar

### P1 — indi demo ilə edilə bilər (10 bənd)

#### Aviabilet

| # | Funksiya (konkret) | Mənbə | Tətbiq qeydi |
|---|---|---|---|
| 1 | **Ay görünüşü qiymət təqvimi** — indiki ±3 gün zolağına "Bütün ay" düyməsi: ayın hər günü üçün ən ucuz qiymət, ən ucuz 3 gün yaşıl, kliklə həmin tarixə axtarış; gediş-dönüşdə "gecə sayı 3–7" seçimi. Altında qeyd: "Qiymətlər təxminidir, yenidən yoxlanılır". (PLAN #3-ün konkretləşdirilməsi) | Skyscanner Whole month [22]; Cheapflights Search by date [21]; Kayak flexible dates [20] | `search.js` təqvim funksiyası artıq var — `calendar=month` rejimi; deterministik demo qiymətlə 30 gün ucuz hesablanır |
| 2 | **"Hara uça bilərəm?" (Everywhere)** — "Hara" boş + büdcə: GYD-dən bütün istiqamətlər ən ucuz qiymətlə ucuzdan bahaya, filtr: yalnız birbaşa, maks. uçuş müddəti, səfər növü; qeyd: "son axtarışlara əsaslanan təxmini qiymət, baqaj daxil olmaya bilər". | Skyscanner Everywhere [22]; Kayak Explore və disklaymeri [19] | Turlardakı `/api/explore` modelinin aviabilet analoqu; `carriers.js` marşrut şəbəkəsindən |
| 3 | **Baqaj sayı formada + "baqajla ümumi qiymət"** — "0 / 1 / 2 çanta" seçimi; kartda qiymət seçilmiş baqajla yenidən hesablanır, tooltip-də bölgü (tarif + vergi + baqaj); detal modalında tarif ailələri cədvəli (əl yükü, qeydiyyat baqajı, dəyişmə, qaytarma) — AZAL-ın Budget/Classic/Plus məntiqinə oxşar. | Kayak "0 bags" + Fee Assistant [15][17]; AZAL tarifləri [1][2] | `pricing.js`-də `fareFamilies` və `bagFee` var — yalnız `bags=N` parametri və UI. Real aviaşirkət normaları "DEMO" kimi qalmalı |
| 4 | **Aktarma riski nişanları** — "Ayrı biletlər (self-transfer) — aktarma qorunmur", "Qısa aktarma (<1 saat)", "Gecə aktarması", "Hava limanı dəyişir (IST→SAW)", "Vizalı tranzit ola bilər"; "Yalnız qorunan aktarmalar" filtri. | Skyscanner self-transfer siyasəti [24][25]; Kayak Hacker Fares [16] | `schedule.js` aktarma vaxtını bilir; ayrı-bilet kombinasiyası üçün demo bayraq |
| 5 | **"Qiyməti izlə" (marşrut üzrə xəbərdarlıq)** — nəticələrin başında açar; e-poçt/WhatsApp; seçim: "gündəlik xülasə" və ya "yalnız ≥10% dəyişiklikdə"; uçuş tarixi keçəndə avtomatik bitir; hər bildirişdə "abunəlikdən çıx". (PLAN #1-in aviabilet üçün konkret forması) | Kayak Price Alerts qaydaları [17] | Demo: abunəliklər yaddaşda, deterministik qiymət dəyişmədiyi üçün "test bildirişi" düyməsi; real — Travelpayouts Data API ilə gündəlik yoxlama |
| 6 | **Naxçıvan marşrutu üçün xüsusi blok** — GYD↔NAJ axtarışında: "Bu marşrutda dövlət tərəfindən tənzimlənən tarif və güzəştli kateqoriyalar var; bilet satışı xüsusi qaydalarla aparıla bilər — dəqiqləşdirmək üçün menecerə müraciət edin", bayram öncəsi "erkən alın" xəbərdarlığı; demo qiymət göstərmək əvəzinə müraciət forması önə çıxarılsın. | 2022 NK qərarı, AZAL bildirişləri [10][11][12] | Rəqəm (60 AZN) yazılmasın — 2026 tarifi təsdiqlənməyib; mətn i18n-də |

#### Otel / tur

| # | Funksiya (konkret) | Mənbə | Tətbiq qeydi |
|---|---|---|---|
| 7 | **Reytinq sözü + rəy sayı** — "Əla 8.9 · 1 240 rəy" formatı (söz şkalası: 9+ "Möhtəşəm", 8+ "Çox yaxşı", 7+ "Yaxşı" — öz şkalamız, hədləri `config.js`-də), reytinq filtri "8+ / 9+"; demo məlumat "DEMO reytinq" kimi işarələnir. | Booking 1–10 şkalası, son 3 il çəkili [29]; Kayak hotel sort by review score [16] | `catalog.js`-də `rating` var, `reviewCount` deterministik əlavə olunur |
| 8 | **Dənizə/mərkəzə məsafə və "çimərlik xətti"** — "1-ci xətt / 2-ci xətt / şəhər", "dənizə ~X m", "hava limanına ~Y km" nişanları + filtr və "məsafəyə görə" sıralama. Kurort turizmi (Antalya, Şarm) üçün əsas qərar meyarı. | Kayak hotel sort by distance [16]; Booking məsafə filtri — **yoxlanılmadı** | Rayon məlumatı artıq var; deterministik demo məsafə; real versiyada operator/otel feed-indən |
| 9 | **Otel detal pəncərəsi: otaq cədvəli** — sətir = otaq tipi × qidalanma, sütunlar: yerləşmə (DBL/TRPL), şərtlər (ilkin ödəniş, pulsuz ləğv tarixi), hər operatorun qiyməti, "Müraciət"; yuxarıda qalereya (mövcud `gallery.js`), altında "otel qaydaları" (check-in/out saatı — DEMO). | Booking otel səhifəsi strukturu — **yoxlanılmadı** (səhifə bloklandı), ümumi sənaye praktikası | Bütün sahələr təklif obyektində var (otaq, yerləşmə, şərtlər) — yalnız qruplaşdırılmış görünüş |

#### Ümumi

| # | Funksiya (konkret) | Mənbə | Tətbiq qeydi |
|---|---|---|---|
| 10 | **"Necə işləyirik" səhifəsi + "Reklam" nişanı siyasəti** — sıralama necə işləyir ("Ən yaxşı" düsturu: qiymət + 0.7×müddət + 0.1×aktarma; ən ucuz mənbə həmişə vurğulanır), pulu kimə ödəyirsiniz, qiymətlər haradan gəlir və nə vaxt yoxlanılıb, ödənişli yerləşdirmə həmişə "Reklam" ilə; **saxta qıtlıq/təcili mesaj göstərmirik** bəyanatı. Nəticə səhifələrində "Ən yaxşı nədir?" tooltip-i. | Kayak How we work [16]; Booking "Our top picks" + "Ad" [28]; CMA/Which?, DMA [31][32] | Statik səhifə + i18n (AZ/EN/RU); `FLIGHTS.md`-dəki düstur artıq var |

### P2 — növbəti mərhələ (real məlumat və ya hesab sistemi lazımdır)

**Aviabilet**
- **Qiymət trendi və "indi al / gözlə"** — etibar səviyyəsi ilə, yalnız kifayət qədər tarixçəsi olan marşrutlarda (Kayak kimi gediş-dönüşlə məhdudlaşdırmaq olar). Əsas: Travelpayouts Data API-dən gündəlik qiymətləri öz DB-mizdə saxlamaq. [17]
- **İki birtərəfli biletin kombinasiyası (Hacker Fares analoqu)** — P1 #4 risk nişanı ilə birlikdə. [16]
- **Mürəkkəb marşrut (multi-city)** və **yaxın hava limanları** (GYD + GNJ/NAJ; IST + SAW). Travelpayouts Flight Search API multi-city dəstəkləyir, amma MAU ≥ 50 000 tələbi var. [36]
- **Uçuş statusu / check-in xatırlatması** (Kayak Flight Tracker) — check-in pəncərəsi aviaşirkətə görə (AZAL üçün 24/48 saat ziddiyyətli [9]).
- **AZAL Miles nömrəsi sahəsi və taksit göstəricisi** (TamKart 2–3 ay) — real satış başlayanda. [5][8]
- **Bakıdan aviabilet trendləri paneli** (həftəlik orta qiymət, metodologiya ilə) — SEO/PR üçün. [20]

**Otel**
- **Xəritə görünüşü** (RESEARCH.md P2-də var) — Kayak Explore xəritəsi kimi qiymət nişanları ilə. [19]
- **Təbii dil axtarışı** ("Antalya, iyul, 2 böyük 1 uşaq, 3000 ₼, dənizə yaxın") — Booking "Search in your own words", Kayak "Ask AI". PLAN #8 (bot) ilə eyni parser.
- **Kampaniya səhifəsi** (Booking Late Escape, Black Friday kimi) — operatorların real erkən rezervasiya/SPO-ları ilə.
- **Obyekt növləri** (otel, apartament, villa, qonaq evi) — daxili turizm (Qəbələ, Şahdağ) üçün.

**Ümumi**
- **"Müqayisə et" (Compare To)** — 2–4 operatorun saytını/təklifini yan-yana açmaq. [21]
- **Deals bülleteni** (həftəlik ucuz istiqamətlər) — Cheapflights/Kayak. [21]

### P3 — uzunmüddətli
- Loyallıq proqramı (Genius kimi səviyyələr: hesab → 5 → 15 rezervasiya) — yalnız real satış və komissiya marjası olanda. [30]
- Mobil tətbiq push qiymət xəbərdarlıqları (əvvəlcə PWA + WhatsApp). [17]
- AI səyahət planlayıcısı ("Plan with AI"). [15]
- Biznes səyahət bölməsi ("I'm travelling for work", KAYAK for Business).
- Qıtlıq mesajları — **yalnız real mövcudluq məlumatı ilə** və "bu qiymətə X qaldı" kimi dəqiq formulada. [31]

---

## (c) Qanuni qiymət mənbələri (API / partnyor proqramları)

> Bütün şərtlər ictimai mənbələrdən götürülüb və dəyişə bilər. "Kim üçün" = TurTap-ın indiki vəziyyəti (şirkət, IATA yoxdur, trafik azdır) nəzərə alınmaqla.

### Aviabilet

| Mənbə | Nə verir | Kimə uyğundur | Qeydiyyat / şərtlər | Məhdudiyyətlər | Link |
|---|---|---|---|---|---|
| **Travelpayouts — Aviasales Data API** | Aviasales istifadəçilərinin **son 48 saatda tapdığı** ən ucuz qiymətlər (tarixlər üzrə, ay təqvimi, qiymət xəritəsi); token ilə | **Ən tez başlanğıc**: təqvim, Everywhere, xəbərdarlıq | Travelpayouts-da qeydiyyat + Aviasales proqramına qoşulma; API token profildə. Platformada qeydiyyat pulsuz kimi təqdim olunur (rəsmi qiymət cədvəli tapılmadı) | Keşlənmiş qiymət (real vaxt deyil) — "X saat əvvəl tapılıb" yazılmalı; limitlər (məs. `/v3/prices_for_dates` 600 sorğu); 24 saat keş tövsiyəsi; satış Aviasales-ə yönləndirmə ilə, komissiya | [34][35] |
| **Travelpayouts — Flight Search API** | Real vaxt axtarış, multi-city | Böyük layihələr | Sorğu ilə | **MAU ≥ 50 000** | [36] |
| **Travelpayouts White Label** | Öz domenində (subdomen, CNAME) hazır aviabilet axtarış motoru | Tez vitrin | Öz domen lazımdır; domendə brend adları qadağandır | Bilet sizdə satılmır — yönləndirmə; xərc məsələsi ziddiyyətli (promo səhifə "ödənişi 2–3 aya qaytarırsınız" deyir) | [37] |
| **Duffel** | Real axtarış + **bilet yazma** (NDC + GDS + lowcost), əlavə xidmətlər, test rejimi | Real satışa keçəndə | Özünə-xidmət qeydiyyatı (üçüncü tərəf mənbələrə görə); Enterprise-də öz IATA akkreditasiyası | Haqlar (rəsmi səhifədə növlər; üçüncü tərəf rəqəmləri: ~$3/sifariş, managed content 1%, $2/əlavə, axtarış:sifariş 1500:1-dən artıq axtarış pullu); Azərbaycan şirkəti üçün əlçatanlıq **yoxlanılmadı** | [38] |
| **Kiwi.com Tequila** | Virtual interlining, axtarış/rezervasiya | — | **2024-05-dən yalnız dəvətlə**; özünə-xidmət qeydiyyatı bağlıdır | Yeni partnyorlar üçün praktik olaraq əlçatmaz | [39] |
| **Amadeus for Developers (Self-Service)** | (keçmişdə) pulsuz test + ödənişli istehsal | — | **Bağlanıb**: 2026-02 elan, yeni qeydiyyat dayandırılıb, açarlar ~2026-07-17 söndürülüb; yalnız Enterprise (satış müqaviləsi) | Yeni layihə üçün istifadə edilməməli | [40] |
| **Skyscanner** | Affiliate: link/banner/axtarış forması (Impact); Travel API | Affiliate — hər kəs; API — böyük partnyor | Impact-da qeydiyyat; API **əl ilə təsdiq**, meyarlar açıq deyil | API-ni almaq çətin; keşləmə qaydaları sərt (üçüncü tərəf iddiası) | [27] |
| **AZAL (agent / NDC)** | AZAL tarifləri əlavə xidmətlərlə | Agentlik statusu ilə | Travelport+ (GDS müqaviləsi) və ya Accelya FLX Select NDC kanalı; ictimai agent portalı tapılmadı → AZAL kommersiya departamenti ilə birbaşa danışıq | Adətən IATA/BSP akkreditasiyası və ya konsolidator lazımdır (FLIGHTS.md); şərtlər **yoxlanılmadı** | [13][14] |

### Otel

| Mənbə | Nə verir | Kimə uyğundur | Qeydiyyat / şərtlər | Məhdudiyyətlər | Link |
|---|---|---|---|---|---|
| **Booking.com Demand API** | Axtarış, mövcudluq, qiymət, rəylər, rezervasiya | Böyük partnyor | **Managed Affiliate Partner** statusu + imzalı müqavilə + hesab meneceri; axtarış icazəsi ≠ rezervasiya icazəsi | Kiçik layihə üçün giriş çətin | RESEARCH.md [19] |
| **Booking.com affiliate (linklər)** | Dərin link/widget, komissiya | Hər kəs | 2025-dən şəbəkələr vasitəsilə (CJ və ya Awin — mənbələr ziddiyyətli) | Qiymət məlumatı vermir | [33] |
| **Expedia Rapid API** | Expedia Group otel inventarı (həcmi yoxlanılmadı), axtarış + rezervasiya, B2B və B2C modelləri | Orta/böyük partnyor | Ərizə → təsdiq → sertifikasiya; B2B/B2C "launch requirements" sənədləri; brend istifadəsi yazılı icazə ilə | Təsdiq müddəti həftələrlə (üçüncü tərəf: 4–12 həftə); trafik/biznes modeli tələbi | [41] |
| **Travelpayouts otel** | — | — | **Hotellook 2025-10-20 bağlanıb, API söndürülüb**; Travelpayouts-un sözünə görə hazırda heç bir otel brendi partnyorlara API vermir; yalnız digər brendlərin linkləri | Otel qiyməti API-si yoxdur | [42] |
| **Hotelbeds APItude** | Otel, transfer, aktivlik API-ləri (B2B topdan) | Developer testi indi, istehsal — müqavilə ilə | Developer portalında qeydiyyat → **qiymətləndirmə açarı (gündə 50 sorğu)**, test host | İstehsal üçün müqavilə/sertifikasiya | [43] |
| **RateHawk (ETG API)** | B2B otel inventarı, axtarış + rezervasiya; affiliate API məqaləsi də var | Turizm şirkəti/agentlik | Şirkət kimi müraciət → API müqaviləsi → sandbox açarı → sertifikasiya → istehsal açarı | Test açarı yalnız test oteli bron edə bilər | [44] |
| **Birbaşa müqavilə** (Azərbaycan otelləri, kanal menecerləri) | Net qiymət | Daxili turizm | Hər otelə ayrıca | Əl işi | PLAN.md |

### Avtomobil

| Mənbə | Nə verir | Şərtlər (ictimai) | Link |
|---|---|---|---|
| **Localrent** | Yerli icarəçilər (Bakı daxil), linklər, widget, **API** | Travelpayouts vasitəsilə; Localrent gəlirinin ~50%-i | [45] |
| **DiscoverCars** | Aggregator; affiliate + **partnyor API** (istifadəçi adı, parol, token) | Birbaşa və Travelpayouts vasitəsilə; komissiya modeli mənbələrdə fərqli | [45] |
| **EconomyBookings** | Affiliate, API və white-label (revenue share və ya net rate) | Faiz mənbələrdə fərqli (44–60%) | [45] |
| **QEEQ** | Affiliate, API sorğu ilə | Travelpayouts, ~5% + üzvlük satışı | [45] |
| **Rentalcars.com** (Booking Holdings) | — | **yoxlanılmadı** | — |

### "Ən tez başlanğıc" — sahibin özü nə etməlidir

1. **Travelpayouts hesabı aç** (travelpayouts.com) → **Aviasales**, **Localrent** və **DiscoverCars** proqramlarına qoşul →
   profildən **API token** və **marker** (partnyor ID) götür → bizə ver (`.env`: `TRAVELPAYOUTS_TOKEN`, `TRAVELPAYOUTS_MARKER`; koda yazılmamalı).
   Bununla: aviabilet ay təqvimi, "Hara uça bilərəm?", qiymət xəbərdarlığı real (keşlənmiş) qiymətlə işləyər, "Bilet al" Aviasales-ə
   marker ilə yönləndirər; avtomobil üçün Localrent/DiscoverCars linkləri. UI-da mütləq: "Qiymət X saat əvvəl tapılıb, yenidən yoxlanılır".
2. **Hotelbeds developer portalında qeydiyyat** → qiymətləndirmə açarı (gündə 50 sorğu) — otel adapterini indidən test etmək üçün
   (istehsal üçün sonra müqavilə). Paralel olaraq **RateHawk**-a turizm şirkəti kimi müraciət (API müqaviləsi + sandbox).
3. Real **bilet satışı** istənilsə: hüquqi şəxs ilə **Duffel** test hesabı (haqları və Azərbaycan üçün əlçatanlığı əvvəlcədən soruşmaq).
4. **AZAL kommersiya / satış departamentinə** yazmaq: agent kanalı (Travelport+ və ya NDC/Accelya), akkreditasiya tələbləri, Naxçıvan güzəştli tariflərinin satış qaydası.
5. Etmə: Amadeus Self-Service (bağlanıb), Kiwi Tequila (yalnız dəvət), Hotellook (bağlanıb) — vaxt itkisidir. Booking Demand API və Skyscanner Travel API — trafik artandan sonra.
6. Sessiyanın şəbəkəsinə `help.azal.az` əlavə edilsə, AZAL tarif qaydaları rəsmi kömək mərkəzindən yoxlana bilər (azal.az özü Cloudflare yoxlaması ilə açılmır).

---

## (d) Mənbə linkləri

1. AZAL — first-time travelers (baqaj normaları) — https://www.azal.az/en/airline/blog/tips-for-first-time-travelers/
2. AZAL kömək mərkəzi — tarif şərtləri bronda görünür; Premium Economy — https://help.azal.az/hc/en-us/articles/36443869169938-Where-can-I-view-fare-conditions-before-booking ; https://help.azal.az/hc/en-us/articles/16739947523602-Premium-Econom ; https://help.azal.az/hc/en-us/articles/36299412204562-How-do-I-know-which-fare-is-best-for-me
3. AZAL Budget tarifi (2016) — https://portal.azal.az/en/airline/news/azal-announces-airfare-of-budget-round-trip-flights/ ; üçüncü tərəf baqaj bələdçisi — https://www.cestujlevne.com/letecka-spolecnost/azerbaijan-airlines/zavazadla
4. AZAL Miles mükafat bileti şərtləri — https://www.azal.az/en/azal-miles/spend-miles/award-ticket/
5. AZAL Miles statusları və proqram — https://www.azal.az/en/azal-miles/discovery/program-statuses/ ; https://portal.azal.az/en/azal-miles/discovery/program-content
6. AZAL Miles yenilənməsi (2024) — https://report.az/en/infrastructure/azal-completes-comprehensive-update-rebranding-of-its-miles-loyalty-program
7. Comarch — AZAL Miles (2026-10) — https://macaubusiness.com/comarch-loyalty-transforms-azerbaijan-airlines-loyalty-program-into-a-fintech-ecosystem/
8. AZAL + ABB TamKart taksit — https://portal.azal.az/en/airline/news/14032024/ ; https://xalqqazeti.az/en/last-news/170882-new-offer-from-azal-and
9. Check-in pəncərəsi (ziddiyyətli) — https://apps.apple.com/app/id1451475994 ; https://tripuck.co.uk/flight-tickets/airline/azerbaijan-airlines-j2 ; https://www.alternativeairlines.com/azerbaijan-airlines
10. Naxçıvan reysləri bərpası (2026) — https://news.az/news/azal-resumes-direct-flights-from-baku-to-nakhchivan ; https://en.apa.az/infrastructure/azal-transports-more-than-47000-passengers-on-nakhchivan-route-in-first-half-of-june-511888
11. Nazirlər Kabinetinin qərarı (2022) — https://portal.azal.az/en/airline/news/the-cabinet-of-ministers-amends-the-resolution-on-the-provision/
12. AZAL: Naxçıvan biletlərini əvvəlcədən alın — https://azertag.az/ru/xeber/azal_rekomenduet_zabronirovat_bilety_iz_baku_v_nahchyvan_i_obratno_zaranee_pered_prazdnikami-2856605
13. AZAL + Accelya NDC (2026-01) — https://report.az/en/infrastructure/azal-partners-with-accelya-to-advance-its-ndc-retail-strategy ; https://w3.accelya.com/resources/press-releases/azerbaijan-airlines-retail-modernization-accelya-flx-select/
14. AZAL + Travelport (2025) — https://travelport.com/press-release/travelport-and-azerbaijan-airlines-renew-strategic-content-distribution-agreement
15. KAYAK ana səhifə — https://www.kayak.com/
16. KAYAK How we work — https://www.kayak.com/c/help/about
17. KAYAK Pricing and Price Alerts — https://www.kayak.com/c/help/pricing
18. KAYAK Airline fees — https://www.kayak.com/airline-fees
19. KAYAK Explore — https://www.kayak.com/explore/
20. KAYAK Airfare Trends — https://www.kayak.com/c/airfare-trends/
21. Cheapflights — https://www.cheapflights.com/ ; https://www.cheapflights.com/book-flights-online/
22. Skyscanner Everywhere — https://www.skyscanner.com/tips-and-inspiration/choose-your-next-adventure-skyscanner-everywhere-search
23. Skyscanner istifadə bələdçiləri (üçüncü tərəf) — https://going.com/guides/how-to-use-skyscanner-to-find-cheap-flights ; https://thevacationer.com/how-to-use-skyscanner/
24. Skyscanner Self Transfer Itinerary Policy — https://skyscannerpartnersupport.zendesk.com/hc/en-us/articles/25946181668381-Self-Transfer-Itinerary-Policy
25. Self-transfer riski (Business Insider) — https://businessinsider.in/thelife/news/i-made-a-huge-travel-mistake-trying-to-save-money-by-booking-my-own-transfer-flight-when-my-first-plane-was-delayed-i-ended-up-stranded-at-the-airport-/amp_articleshow/102990835.cms
26. Skyscanner: indi al yoxsa gözlə — https://www.skyscanner.co.in/flights/advice/should-i-book-flights-now-or-wait-heres-what-our-data-says
27. Skyscanner affiliate/API (üçüncü tərəf) — https://ignav.com/docs/skyscanner-api-access ; https://www.travelpayouts.com/blog/skyscanner-flight-affiliate-program/amp/ ; https://skyscannerpartnersupport.zendesk.com/hc/en-us/categories/4524560891549-Affiliate-Flights-API
28. Booking.com How we work — https://www.booking.com/content/how_we_work.en-gb.html (bu sessiyada 403; axtarış fraqmentindən)
29. Booking.com rəy balı — https://www.hospitalitynet.org/news/4125072/bookingcoms-new-review-scoring-what-it-means-for-hotels ; https://holidu.com/help/host/reviews/24074562264849-how-does-booking-com-calculate-the-review-score
30. Genius — https://www.booking.com/genius.html ; https://thepointsguy.com/guide/booking-com-genius-loyalty-programme/
31. CMA / Which? — https://www.which.co.uk/news/2019/09/booking-com-still-misleading-holidaymakers-with-1-room-left-claims/ ; https://travolution.com/articles/110267/competition-watchdog-clamps-down-on-otas
32. Booking.com DMA gatekeeper — https://techcrunch.com/2024/05/13/booking-latest-to-fall-under-eu-market-power-rules
33. Booking affiliate dəyişiklikləri — https://www.netinfluencer.com/booking-com-moves-all-affiliates-to-awin-what-to-know-about-termination-notices ; https://track360.io/blog/booking-com-affiliate-partner-program-operator-teardown-2026
34. Travelpayouts Aviasales Data API — https://support.travelpayouts.com/hc/en-us/articles/203956163 ; https://support.travelpayouts.com/hc/en-us/articles/203956083-Requirements-for-Aviasales-data-API-access
35. Travelpayouts API limitləri — https://support.travelpayouts.com/hc/en-us/articles/4402565416594
36. Aviasales Flight Search API — https://support.travelpayouts.com/hc/en-us/articles/30565016140434
37. Travelpayouts White Label — https://support.travelpayouts.com/hc/en-us/articles/203955753 ; https://support.travelpayouts.com/hc/en-us/articles/16436383582226-Travelpayouts-White-Label-Web-Setup-Guide ; https://travelpayouts.com/promo/whitelabel/en
38. Duffel — https://duffel.com/pricing ; https://duffel.com/docs/guides/getting-an-accurate-price-before-booking
39. Kiwi.com tərəfdaşlıq yanaşması — https://media.kiwi.com/articles-and-interviews/better-for-business-kiwi-com-takes-a-new-approach-to-partnerships/
40. Amadeus Self-Service bağlanması — https://www.phocuswire.com/amadeus-shut-down-self-service-apis-portal-developers ; https://amadeus.com/en/industry-messaging/statement-regarding-amadeus-for-developers-portal
41. Expedia Rapid launch requirements — https://developers.expediagroup.com/rapid/setup/launch-requirements/b2b-standalone ; https://developers.expediagroup.com/rapid/setup/launch-requirements/b2c-standalone
42. Hotellook bağlanması — https://support.travelpayouts.com/hc/en-us/articles/29534131568530-FAQ-on-the-closure-of-Hotellook
43. Hotelbeds developer — https://developer.hotelbeds.com/documentation
44. RateHawk — https://help.ratehawk.com/en/articles/9324649-affiliate-api
45. Avtomobil proqramları — https://www.travelpayouts.com/en/offers/localrent-affiliate-program ; https://www.discovercars.com/affiliate ; https://support.travelpayouts.com/hc/en-us/articles/360012655219-DiscoverCars-affiliate-program-API ; https://www.economybookings.com/s/business-to-business ; https://www.travelpayouts.com/en/offers/qeeq-affiliate-program

**Bu sessiyada açılmayanlar:** azal.az (Cloudflare yoxlaması), help.azal.az (şəbəkə siyahısında yoxdur), skyscanner.net (captcha),
booking.com daxili səhifələri (403 bot bloku), axtarış nəticə səhifələri (qəsdən açılmadı — robots.txt və qayda).
