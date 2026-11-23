# Odiola — araşdırma 3: tur agentlikləri üçün B2B portallar, aqreqatorlar və CRM-lər

Tarix: 2026-11-23. Fokus: əvvəlki sənədlərdə (`RESEARCH.md`, `RESEARCH-2.md`, `OPERATORS-SAMO.md`) əhatə olunmayan sahə — **agentliyin gündəlik iş aləti**: çox-operatorlu axtarış portalları (Tourvisor, Sletat PRO), operator agent kabinetləri (SAMO), B2C aqreqatorların tərəfdaş proqramları (Level.travel, Travelata, Onlinetours), Türkiyə OTA-larının agentlik şəbəkələri (Tatilbudur, Etstur, Setur, Jolly, Tatilsepeti) və tur agentliyi CRM-ləri (U-ON.Travel, Мой Агент, TourControl, Мастер-Агент).

## 0. Metodologiya və məhdudiyyətlər

- Yalnız **web axtarış nəticələri** (başlıq + qısa parça) istifadə olundu. Səhifələri birbaşa açmaq cəhdi bu sessiyada alınmadı: `toolfox.ru` və `en.samo.ru` DNS səviyyəsində bloklandı (ENOTFOUND); bundan sonra digər saytlar açılmağa cəhd edilmədi. Scraping edilmədi.
- Bir çox fakt **üçüncü tərəf kataloqlarından** (toolfox.ru, crmindex.ru, startpack.ru, a2is.ru) və tərəfdaş şəbəkəsinin bloqundan (Travelpayouts) gəlir — rəsmi sənəd deyil. Belə yerlər cədvəldə "(kataloq)" kimi qeyd olunub.
- Qiymətlər mənbələr arasında **fərqlənir** (məs. U-ON: 699 ₽ və 899 ₽) — hər ikisi verilir, heç biri "rəsmi" sayılmır.
- "**yoxlanılmadı**" = axtarışda sübut tapılmadı; bu, funksiyanın olmadığı demək deyil.

### Artıq mövcud və ya paralel olaraq "planlaşdırılıb" (burada təkrarlanmır)

- **Var (PLAN.md §2):** matris (otel × operator), sütunlu cədvəl, komissiya % (bir rəqəm), müştəriyə mətn (Kopyala/WhatsApp), CSV, son sorğular, brendli seçim linki `/s/<id>`, "Müraciətlər" bölməsi, admin/manager rolları, B2C-də "Hara gedə bilərəm?", son dəqiqə, taksit vitrini, ləğv şərtləri, qiymət təzəliyi, operator etibar bloku, uşaq yaşları, geri zəng, reytinq sözü, məsafə/xətt, otel detal pəncərəsi, "Necə işləyirik".
- **Planlaşdırılıb (paralel):** Telegram/e-poçt müraciət bildirişləri, müraciət CRM statusları; B2B "ən ucuz təklif" paneli, seçilmişlər (shortlist), çap/PDF təklif, "qiyməti aktuallaşdır"; B2C seçilmişlər (♥), otel müqayisəsi, son baxılanlar, tur qiymət təqvimi, rəy kateqoriya balları, əlaqə/WhatsApp düyməsi, paylaş.
- **Əvvəlki P2/P3-də olan:** CRM üçün API/webhook, "Ailə/Cütlük" etiketləri, deals bülleteni, qiymət fərqi zəmanəti, mobil tətbiq.

---

## 1. Platformalar — qısa cədvəl

### 1.1 Çox-operatorlu axtarış portalları (agentlik üçün)

| Platforma | Model | Agentlik funksiyaları (tapılan) | B2C tərəfi | Qiymət / tarif | Mənbə |
|---|---|---|---|---|---|
| **Tourvisor** (RU) | 100+ operatoru bir axtarışda göstərən B2B motor; 30 000+ agent (kataloq) | Tourvisor PRO "agentin əsas iş yeri": tur axtarışı + CRM + **kolleksiyalar (подборки)** + pulsuz sayt-mağaza (domen və hostinq daxil) + **10+ sayt modulu/vidjet** (kataloq). **Telegram bot** — agentliyin Telegram kanalına "горящие" təklifləri avtomatik post kimi göndərir; **müraciətlərin menecerlər arasında paylanması**, **çox-ofislilik** (kataloq). **"Seçilmiş otellər siyahıları"** — agentlik öz meyarı ilə siyahı yaradır ("kiçik uşaqlı ailələr üçün", "romantik"), menecerlərə və ya sayt müştərilərinə görünən edir, axtarışda siyahını işarələməklə yalnız həmin otellər çıxır (ATOR xəbəri). CRM-lərə API: tourvisor.ru-dan hazır müraciət + seçilmiş variant ötürülür (kataloq, T-Bank bloqu); Мастер-Агент CRM-də daxili axtarış kimi var | Turist tətbiqi: 90+ operator, 100 000+ otel real vaxt müqayisə; otel axtarışı operatorlar + Ostrovok/Bronevik/Yandex Travel; **bütün yığımlar daxil yekun qiymət axtarış mərhələsində** (App Store təsviri) | PRO — sorğu ilə; **10 gün pulsuz sınaq** (kataloq). Ayda 20 000+ tur müraciəti agentliklərə ötürülür (kataloq) | [1][2][3][4][5] |
| **Sletat.ru / Sletat PRO** (RU) | 100+ operator bazası; agentlik saytı üçün axtarış modulu | **Bir linklə seçim (подборка)** müştəriyə; **AI analiz**: seçilmiş otelin analoqlardan fərqini mətnlə izah edir (qiymət, reytinq) + yanında oxşar otellər qiymətlə; **AI otel təsviri seçim üçün auditoriyaya görə** (ailə / cütlük); "Слетать AI" rəyləri turist tipinə görə xülasə edir (Ailələr, Aktiv, Sakit, Estetlər…). Agentlik saytında modul — müraciətlər kabinetə və ya CRM-ə (viasun.ru nümunəsi) | Turist tətbiqi (iOS) | "Bulud (sletat.ru / ТурОфис CRM)" — 84 900 ₽/ay-dan (kataloq; çox yüksək görünür, **yoxlanılmadı**) | [6][7][8][9] |

### 1.2 Operator agent kabineti

| Platforma | Agentlik funksiyaları | Qiymət | Mənbə |
|---|---|---|---|
| **SAMO-tour Online (B2B)** | Operator saytında aktual qiymət, reyslərdə yer, otel stop-sale; tərəfdaş agentliklərə onlayn bron; turistə şəxsi kabinet; **qiymət dinamikası**, **taksit hesablaması**, valyuta seçimi; sistemin **tərəfdaş agentlərin saytlarına köçürülməsi (тиражирование)**; təkliflər "САМО-турагент" proqramına sürətli bron üçün yayımlanır. Yeniliklər (developer xəbərləri): 2026.02 — axtarış səhifəsinin mobil adaptasiyası, otel dəyişmə interfeysi; 2025.11 — şəhər filtri, SBP və "soyuma dövrü" olan taksit; 2026.03 — iOL X B2B inteqrasiyası. **Agent kabinetinin ətraflı ictimai təsviri tapılmadı** (en.samo.ru açılmadı) | — | [10][11] |
| **SAMO-турагент** (agentlik proqramı) | Tur, aviabilet, dəmiryol axtarışı; müraciətlər; müştəri bazası; **komissiya və endirimlərlə qiymət hesabı**; uçot; lokal və bulud versiya | Lisenziya 30 000 ₽ (birdəfəlik), agentlik saytına onlayn bron 15 000 ₽/il (kataloq) | [10][12] |

### 1.3 B2C aqreqatorlar və onların tərəfdaş/agent modeli

| Platforma | Agentlik / tərəfdaş üçün nə var | Mənbə |
|---|---|---|
| **Level.travel** | Ayrıca agentlik B2B proqramı **tapılmadı**; affiliate: yeni müştəri üçün **4,25%**, təkrar üçün **2%** (Travelpayouts; Partnerkin 4,2%). Travelata ilə birlikdə "öz turları" (başqa yerdə olmayan) | [13][14][15] |
| **Travelata** | Affiliate (mobil tətbiq sifarişləri də sayılır), API, **həftəlik populyar turlar feed-i** (forma ilə). "МойАгент" ilə birgə Rusiya turları — **dinamik paketləmə**, ani təsdiqlənən inventar. 2025-də agentlərə **françayzinq** təklif edib (Tourdom; şərtlər yoxlanılmadı) | [16][17][18] |
| **Onlinetours** | Affiliate: ~2,66% (bir mənbə) və ya eCPC $0,05; ~100 operator, 50 RU şəhərindən 70+ ölkə | [19] |

### 1.4 Türkiyə OTA-larının agentlik kanalları

| Platforma | Tapılan | Mənbə |
|---|---|---|
| **Tatilbudur** | "Şubelik Başvuru Formu" (filial müraciəti) — şərtlər görünmür; otel tərəfi üçün kanal meneceri inteqrasiyası; TB Club (müştəri xalları). Agentlik B2B portalı **yoxlanılmadı** | [20][21] |
| **Tatilsepeti** | "Acentemiz Olun": TÜRSAB-a üzv agentlik, turizm təcrübəsi, yüksək axınlı yer (AVM/küçə), ≥3 m² lövhə; müraciət forması + "sizə zəng edək" | [22] |
| **Etstur** | Satış kanalları: sayt, tətbiq, çağrı mərkəzi və **Türkiyə üzrə Etstur agentlikləri**; otel səhifələrində "yetkili satış acentesi" ifadəsi. "Ets Acente" B2B sisteminin təsviri **tapılmadı** | [23] |
| **Setur** | **200-dən çox səlahiyyətli və sistem satış agentliyi** şəbəkəsi (öz "Haqqımızda"); françayz şərtləri tapılmadı | [24] |
| **Jolly** | Bron kanalları: sayt, tətbiq, **"yetkili seyahat acentelerimiz"**, çağrı mərkəzi; **Jolly Extranet** — otellər üçün (agentlik portalı deyil). Agentlik B2B portalı **yoxlanılmadı** | [25][26] |

### 1.5 Tur agentliyi CRM-ləri

| CRM | Funksiyalar (tapılan) | Qiymət | Mənbə |
|---|---|---|---|
| **U-ON.Travel** | Müraciətlər, sövdələşmələr, turist bazası, satış qıfı, əlaqə tarixçəsi, **işçi effektivliyi monitorinqi**, e-poçt (və Unisender ilə SMS) göndərişi, analitika, tapşırıq/xatırlatma, mobil versiya; **3 redaktə edilən müqavilə şablonu** (turistlə, agentliklə, hüquqi şəxslə); **SMS kodu ilə elektron imza**; **seçimi müştəriyə WhatsApp / Telegram / e-poçtla göndərmək**; **pasport skanından avto-doldurma** (2018); API/Webhook, çat inteqrasiyaları. Turist şəxsi kabineti **tapılmadı** | 699 ₽ (Эконом) – 2 349 ₽/ay (Премиум) və ya "Эконом / 3 işçi" 899 ₽ — mənbələr fərqlidir; 14 gün sınaq; ≥6 ay ödənişdə pulsuz tətbiq və təlim (kataloq) | [27][28][29][30] |
| **Мой Агент** (myagent.online) | Agentliklər üçün B2B: müntəzəm/çarter/loukost aviabilet, dəmiryol, otel, sığorta real vaxtda; **agentlik loqosu ilə sənəd çıxarışı**; **depozit və kredit xətti**; agentlik yığımları marşrut qəbzində görünür; qoşulma ~1 gün | "Партнёр" tarifi pulsuz; komissiya şərtləri müqavilədə (açıq deyil) | [31] |
| **TourControl** | IP-telefoniya, müraciət idxalı, satış qıfı, müraciətdə bron/bilet/yerləşmə/ödəniş/sənəd, müştəri bazası (idxal/ixrac), kataloq, təqvim; **operator saytlarından turu köçürən brauzer əlavəsi**; Pegas/Anex B2B ilə iş. **Bir mənbəyə görə 2023-cü ilin sentyabrından yeni qeydiyyat bağlıdır** | ~150 ₽/ay-dan (kataloq, köhnə ola bilər) | [32][33] |
| **Мастер-Агент** | Bulud CRM (1800+ şirkət, kataloq): **operatorlardan müraciət idxalı**, daxili **Tourvisor axtarışı**, maliyyə uçotu, IP-telefoniya, **AI kvalifikator** | yoxlanılmadı | [34] |

---

## 2. Odiola-da OLMAYAN funksiyalar

### P1 — demo məlumatla indi edilə bilən (10 bənd: B2B 7 + B2C 3)

#### B2B (`/b2b`)

| # | Nə (konkret) | Harada | Niyə | Mənbə |
|---|---|---|---|---|
| B1 | **Agentliyin "tövsiyə olunan otel siyahıları"** — adlı, təkrar istifadə olunan siyahılar ("Kiçik uşaqlı ailələr", "Romantik", "Bizim top-20 Antalya"); axtarış formasında "Siyahı" seçimi → yalnız həmin otellər; siyahını "menecerlər üçün" / "müştəriyə görünən" kimi işarələmək. Shortlist-dən fərqi: shortlist bir müştəri üçün **təkliflər**, bu isə agentliyin daimi **otel bilgisi**dir | `b2b.html` formasında otel multi-select yanında select; `src/routes/b2b.js` + storage-də agentlik üzrə `hotelLists` (demo: yaddaş/DB) | Agentliyin dəyəri — "biz bu otelləri tanıyırıq"; yeni menecer də təcrübəli kimi seçim edir; matris/cədvəl daralır | Tourvisor [4] |
| B2 | **Çevik komissiya qaydaları** — bir % əvəzinə qaydalar cədvəli: operator / istiqamət / qiymət növü (EB, SPO) üzrə %, **+ sabit məbləğ (₼)**, minimum marja, **yuvarlaqlaşdırma** (məs. 5 ₼-a yuxarı, "…9" ilə bitən qiymət); cədvəldə "net → marja → müştəri" sütunları | `b2b.html` komissiya sahəsinin yanında "Qaydalar" modalı; `src/leads.js` `markup` hesabı qaydalar funksiyasına | Real agentliklər operatordan asılı fərqli marja qoyur; bir % ya qiyməti şişirdir, ya qazancı azaldır | SAMO-турагент "komissiya və endirimlərlə hesab" [12]; U-ON [27] |
| B3 | **Müştəri bazası (mini-CRM kartı)** — müştəri: ad, telefon, uşaq yaşları, adətən büdcə, sevdiyi istiqamətlər, keçmiş axtarışlar/seçim linkləri/müraciətlər; müştəri seçəndə forma avtomatik dolur ("uşaq yaşları 4 və 9, büdcə 4000 ₼") | "Son sorğular"dakı `client` sahəsi → `Müştərilər` bölməsi; demo yaddaş/DB | Hazırda müştəri adı yalnız tarixçədə mətn kimidir; təkrar müraciətdə vaxt qənaəti; abunə tarifinin əsas "yapışqan" hissəsi | U-ON, TourControl, SAMO-турагент [27][32][12] |
| B4 | **Təklifə avtomatik "niyə bu otel" izahı (qaydaya əsaslanan, AI-siz)** — seçim linkində/PDF-də hər variant üçün: "Ən ucuz variantdan +180 ₼, amma 1-ci xətt, reytinq 9.1, CHD FREE"; "Oxşar otellər" bloku (eyni rayon, ±1 ulduz, ±15% qiymət); auditoriya seçimi (ailə / cütlük) mətnin vurğusunu dəyişir | `public/js/b2b.js` `quoteText()` + `/s/<id>` səhifəsi (`s.js`); məlumat artıq var: reytinq, xətt, atributlar, qiymət | Menecerin ən uzun işi — müştəriyə fərqi izah etmək; indi bu, şablonla demo məlumatla edilə bilər, sonra LLM ilə əvəzlənər | Sletat PRO AI analiz və AI təsvirlər [7][8] |
| B5 | **Agentlik saytı üçün vidjet (embed)** — `<iframe src="/w/<agencyId>">` və ya `<script>`: axtarış forması + nəticələr agentlik rəngi/loqosu ilə, operator adı və net qiymət gizli, müştəri qiyməti komissiya qaydaları ilə; "Müraciət" → həmin agentliyin "Müraciətlər" bölməsinə | yeni `public/w.html` + `/w/:id` route; B2B-də "Saytıma yerləşdir" → kopyalanan kod | Kiçik AZ agentliklərinin saytında axtarış yoxdur (yalnız WhatsApp); bu, Odiola-nı onların saytına daşıyır və abunəni əsaslandırır | Tourvisor 10+ modul [1]; SAMO тиражирование [10]; Sletat modul [9] |
| B6 | **Telegram/Instagram kanal postu generatoru** — "Son dəqiqə" və ya seçilmiş təkliflərdən hazır post: başlıq, 3–5 variant (otel, tarix, gecə, qida, müştəri qiyməti), agentlik əlaqəsi, seçim linki; "Kopyala" + kvadrat şəkil kartı (canvas → PNG) | `b2b.html` seçim panelində "Kanal postu" düyməsi; mövcud `quoteText` məntiqi | AZ agentlikləri satışın böyük hissəsini Telegram/Instagram kanallarından edir; Tourvisor bunu avtomatik bot kimi satır (bildiriş botu planlaşdırılıb, amma **kanal kontenti** deyil) | Tourvisor Telegram bot [2] |
| B7 | **Agentlik brend profili** — loqo, rəng, telefon/WhatsApp, ünvan, VÖEN/lisenziya, imza mətni; seçim linkində, PDF təklifdə, vidjetdə və kanal postunda avtomatik istifadə | B2B-də "Agentlik profili" (admin rolu); `s.js` və planlaşdırılan PDF şablonu bu profili oxuyur | Hazırda `/s/<id>`-də yalnız agentlik adı var; "öz brendimlə sənəd" agentliklər üçün əsas tələbdir | Мой Агент "agentlik loqosu ilə sənəd" [31]; Tourvisor brendli kolleksiyalar [1] |

#### B2C (`/`)

| # | Nə (konkret) | Harada | Niyə | Mənbə |
|---|---|---|---|---|
| C1 | **"Qiymətə nə daxildir" bloku** — hər təklifdə yaşıl/boz siyahı: uçuş, otel, qida, transfer, tibbi sığorta, baqaj (daxil); viza, turist vergisi, depozit, ekskursiyalar (daxil deyil / naməlum); "DEMO — operatordan dəqiqləşdirilir" | Otel detal pəncərəsi və kart tooltip-i; təklif obyektinə `includes` / `excludes` (deterministik demo) | Müqayisə saytında "ucuz göründü, sonra əlavə çıxdı" etibarı öldürür; Tourvisor "bütün yığımlar daxil yekun qiyməti" B2C üstünlüyü kimi göstərir | Tourvisor tətbiqi [5] |
| C2 | **"Agentlik vasitəsilə al" — tərəfdaş agentlik seçimi** — müraciət formasında "Kim sizinlə əlaqə saxlasın?": Odiola meneceri və ya şəhər üzrə tərəfdaş agentliklər (ad, reytinq, cavab vaxtı — DEMO); müraciət seçilən agentliyin "Müraciətlər" bölməsinə düşür | `index.html` müraciət forması + `src/leads.js` (lead → `agencyId`); B2B tərəfində artıq "Müraciətlər" var | B2C trafikini agentliklərə **lead** kimi satmaq — Tourvisor-un əsas modeli (ayda 20 000+ müraciət); həm də gəlir modeli (§3) | Tourvisor [1][3] |
| C3 | **Müraciət status səhifəsi** — müraciətdən sonra şəxsi link (`/r/<id>`): "Qəbul edildi → Menecer baxır → Variant göndərildi → Təsdiqləndi", menecerin adı, WhatsApp düyməsi, göndərilən seçim linki | Yeni kiçik səhifə; planlaşdırılan CRM statuslarını müştəri tərəfə açır | "Müraciət etdim, sonra nə?" narahatlığını azaldır, zəng sayını azaldır. Analoqu axtarışda **tapılmadı** (SAMO-da "turist şəxsi kabineti" var, təfərrüat yoxlanılmadı) | SAMO [10]; sənaye praktikası — yoxlanılmadı |

### P2 — növbəti mərhələ (hesab sistemi / real məlumat lazımdır)

| Funksiya | Niyə | Mənbə |
|---|---|---|
| **Müraciətlərin menecerlər arasında avtomatik paylanması** (növbə, istiqamət, yük) və **çox-ofis** | Böyük agentliklər üçün; rollar artıq var | Tourvisor [2] |
| **Menecer KPI paneli** — müraciət sayı, cavab vaxtı, seçim linki → müraciət konversiyası, marja | Rəhbər üçün əsas hesabat | U-ON "işçi effektivliyi" [27] |
| **Seçim linki analitikası** — müştəri açdı / neçə dəfə / hansı varianta baxdı | Menecer nə vaxt zəng edəcəyini bilir | yoxlanılmadı (sənaye praktikası) |
| **Müqavilə şablonları + SMS kodu ilə e-imza** (turistlə müqavilə, AZ qanunvericiliyinə uyğun) | Ofisə gəlmədən satış | U-ON [28] |
| **Pasport skanından turist məlumatının avto-doldurulması** | Bron zamanı səhv adları azaldır (aviabilet üçün kritik) | U-ON [29] |
| **Operatordan bron/müraciət idxalı** və ya brauzer əlavəsi ilə operator saytından turu Odiola seçiminə köçürmək | Real API olmayan operatorlar üçün körpü | TourControl [32], Мастер-Агент [34] |
| **Turist tipinə görə rəy xülasəsi** ("Ailələr", "Sakit istirahət", "Gənclər") — kateqoriya ballarının davamı | Planlaşdırılan "rəy kateqoriya balları"ndan sonra | Sletat AI [8] |
| **Ödəniş uçotu** — müştəridən alınan / operatora ödənən / borc, valyuta fərqi | Agentliyin maliyyəsi; CRM-in "pullu" hissəsi | TourControl, Мастер-Агент [32][34] |
| **Həftəlik "populyar turlar" feed-i** (JSON/RSS) tərəfdaş saytlar və kanallar üçün | Affiliate və agentlik kanalları üçün kontent | Travelata [16] |

### P3 — uzunmüddətli

| Funksiya | Qeyd | Mənbə |
|---|---|---|
| **Depozit / kredit xətti ilə birbaşa bron** (agentlik balansı) | Operator müqavilələri və hüquqi baza tələb edir | Мой Агент [31] |
| **Agentlik üçün hazır sayt (white-label)** — domen + hostinq daxil | Vidjetin (B5) növbəti səviyyəsi | Tourvisor [1] |
| **Dinamik paketləmə — Odiola-nın "öz turları"** (uçuş + otel ayrıca mənbələrdən) | Travelata/Level.travel fərqləndiricisi; turoperator statusu tələb edə bilər | [15][17] |
| **IP-telefoniya inteqrasiyası, AI müraciət kvalifikatoru** | CRM dərinləşəndə | TourControl, Мастер-Агент [32][34] |
| **Françayz / səlahiyyətli satış nöqtələri şəbəkəsi** (Odiola brendi ilə ofislər, Tatilsepeti tipli tələblər) | Brend tanınandan sonra | Tatilsepeti [22], Setur [24], Travelata [18] |
| **Agentlər üçün mobil tətbiq** (müraciət push, sürətli seçim) | Əvvəlcə PWA | — |

---

## 3. Agentliklər üçün gəlir modeli ideyaları

**Bazar istinadları (yoxlanılmış rəqəm deyil, kataloq məlumatı):** U-ON 699–2 349 ₽/ay, 14 gün sınaq [27]; SAMO-турагент 30 000 ₽ birdəfəlik + sayt modulu 15 000 ₽/il [12]; Tourvisor PRO sorğu ilə, 10 gün sınaq [1]; Мой Агент pulsuz, gəlir komissiyadan [31]; aqreqator affiliate-ləri satışın 2–4,25%-i [13][19]. Nəticə: bazar **ucuz aylıq abunə + pulsuz sınaq** və ya **pulsuz + komissiya** modelinə öyrəşib.

### Təklif olunan tariflər (qiymətlər — test üçün fərziyyə, AZN)

| Tarif | Kimə | Nə daxildir |
|---|---|---|
| **Start — pulsuz** | Tək menecer, sınamaq | 1 istifadəçi; axtarış, matris, cədvəl; tək % komissiya; ayda 10 seçim linki ("Odiola ilə" nişanı ilə); CSV yox |
| **Pro — ~29–49 ₼/ay** | Kiçik agentlik (1–3 menecer) | 3 istifadəçi; limitsiz seçim linki **agentlik brendi ilə** (B7); PDF təklif; shortlist; çevik komissiya qaydaları (B2); otel siyahıları (B1); müştəri bazası (B3); Telegram/e-poçt bildirişləri; kanal postu generatoru (B6); CSV |
| **Biznes — ~99–149 ₼/ay** | Orta agentlik, çox ofis | 10 istifadəçi; **sayt vidjeti** (B5); müraciətlərin paylanması və menecer KPI; seçim linki analitikası; "niyə bu otel" izahları (B4, sonra AI); API/webhook; prioritet dəstək |
| **Enterprise — sorğu ilə** | Operatorlar, şəbəkələr | White-label sayt, xüsusi inteqrasiya, SLA |

### Əlavə gəlir axınları

1. **Lead satışı (C2):** B2C müraciəti tərəfdaş agentliyə — müraciət başına sabit haqq və ya bron olunarsa satışın %-i. Abunəçilərə endirimli lead qiyməti.
2. **Operatorlardan komissiya/CPA:** B2C yönləndirmə və agentlik bronları üçün (PLAN §5 ilə uyğun).
3. **Önə çıxarılmış yerləşdirmə** — operator/agentlik üçün, həmişə "Reklam" nişanı ilə (RESEARCH-2 #10 siyasəti).
4. **Vidjet quraşdırma haqqı** (birdəfəlik) və illik ödənişdə 2 ay pulsuz.
5. **Pulsuz sınaq:** 14 gün tam Pro (bazar normasına uyğun: 10–14 gün [1][27]).

Qeyd: tarif limitləri (istifadəçi sayı, link sayı) indi kodda yoxdur — demo üçün `config.js`-də `plans` obyekti və UI-da "Pro funksiyası" nişanı ilə göstərmək kifayətdir; ödəniş inteqrasiyası P2.

---

## 4. Mənbə linkləri

Açılmadı (DNS blok): `toolfox.ru`, `en.samo.ru` — bu mənbələrdən olan faktlar yalnız axtarış nəticəsi parçalarına əsaslanır.

1. Toolfox — Tourvisor (kataloq): https://toolfox.ru/services/s/tourvisor
2. Toolfox — Tourvisor alternativləri: https://toolfox.ru/services/s/tourvisor/alternatives
3. T-Bank Secrets — CRM для турагентства: https://secrets.tbank.ru/blogi-kompanij/crm-dlya-turagentstva/
4. ATOR — «Списки избранных отелей» в Турвизоре: https://www.atorus.ru/node/55468
5. App Store — Tourvisor: https://apps.apple.com/ru/app/tourvisor-%D1%82%D1%83%D1%80%D1%8B-%D0%B8-%D0%BF%D1%83%D1%82%D0%B5%D0%B2%D0%BA%D0%B8/id1605969538 ; Trashbox: https://trashbox.ru/link/tourvisor-android
6. kod.ru — подборка туров одной ссылкой (Sletat PRO): https://kod.ru/kak-uprostit-vybor-tura-dlya-klienta
7. kod.ru — ИИ-анализ туров Sletat PRO: https://kod.ru/ii-analiz-turov-sletat-ru-pro
8. kod.ru — AI-описания отелей / группировка отзывов: https://kod.ru/sletat-pro-ai-opisaniya-oteley ; https://kod.ru/sletat-ai-gruppirovka-otzyvov-po-tipam-turistov
9. viasun.ru — agentlik FAQ (Sletat modulu): https://viasun.ru/agency/faq
10. SAMO — Online booking system for SAMO-tour (B2B): https://en.samo.ru/tour/addons/item/546.html ; xəbərlər: https://en.samo.ru/about/novosti.html
11. SAMO — Additional modules: https://en.samo.ru/tour/addons.html
12. CRMindex — САМО-турагент: https://crmindex.ru/products/samo_touragent ; SAMO touragent təsviri: https://en.samo.ru/touragent/touragent-info.html?sub=517
13. Travelpayouts — Level.Travel партнёрская программа: https://www.travelpayouts.com/ru/blog/partnyorskaya-programma-leveltravel/
14. Partnerkin — Level.Travel: https://partnerkin.com/blog/articles/affiliate-programs-leveltravel
15. Travelpayouts — собственные туры Travelata и Level.Travel: https://www.travelpayouts.com/ru/blog/own-tours/
16. Travelpayouts — Travelata партнёрская программа: https://www.travelpayouts.com/ru/offers/travelata-partnerskaya-programma/
17. Travelpayouts — Travelata и «МойАгент»: https://www.travelpayouts.com/ru/blog/turoperator-travelata-myagent/
18. Tourdom — Travelata пригласила турагентов: https://www.tourdom.ru/hotline/strategii-kompaniy/travelata-priglasila-turagentov-zarabatyvat-vmeste/
19. Travelpayouts — Onlinetours: https://www.travelpayouts.com/ru/offers/onlinetours-partnerskaya-programma/
20. Tatilbudur — Şubelik başvuru formu: https://www.tatilbudur.com/subelik-basvuru-formu
21. SabeeApp — Tatilbudur connection guide: https://www.sabeeapp.com/knowledge-base/tatilbudur-connection-guide
22. Tatilsepeti — Acentemiz Olun: https://www.tatilsepeti.com/acentemiz-olun
23. Etstur — Satış Kanalları: https://www.etstur.com/Satis-Kanallari
24. Setur — Hakkımızda: https://www.setur.com.tr/kurumsal/hakkimizda
25. Jolly — Jolly Extranet: https://www.jollytur.com/jolly-extranet
26. Jolly — kampaniya şərtləri (satış kanalları): https://www.jollytur.com/on-odemesiiz-oteller-kampanya-kosullari
27. Toolfox — U-ON.Travel: https://toolfox.ru/services/s/u-on-travel ; CRMindex: https://crmindex.ru/products/u_on_travel ; A2iS: https://a2is.ru/catalog/crm-dlya-turizma/u-ontravel
28. Spark — U-ON.Travel (müqavilələr, e-imza, beynəlxalq): https://spark.ru/startup/u-on/blog/134116/novie-vozmozhnosti-v-u-on-travel-dlya-mezhdunarodnih-klientov
29. CRMindex — pasport skanından avto-doldurma: https://crmindex.ru/blog/avto-zapolnenie-dannyh-po-skanu-pasporta
30. Unisender — U-ON.Travel inteqrasiyası: https://www.unisender.com/ru/support/integration/crm/u-on-travel/
31. Toolfox — Мой Агент: https://toolfox.ru/services/s/myagent
32. Startpack — TourControl: https://startpack.ru/application/tourcontrol ; CRMindex: https://crmindex.ru/products/tourcontrol
33. Toolfox — TourControl: https://toolfox.ru/services/s/tourcontrol
34. Toolfox — CRM для турагентств (Мастер-Агент): https://toolfox.ru/services/turizm-soft/turagentstva
