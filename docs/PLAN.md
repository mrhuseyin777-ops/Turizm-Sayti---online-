# eTour — məhsul planı

## 1. Ad təklifləri

| Ad | Mənası / niyə | Domen ideyası |
|---|---|---|
| **eTour** ⭐ (işçi ad) | "Tur tap" — azərbaycanca aydındır, xarici dildə də asan oxunur, qısa | etour.az / turtap.com |
| **Turbaz** | Tur + bazar — "bütün turlar bir bazarda" | turbaz.az |
| **Gəzinti** | Yumşaq, yerli, emosional | gezinti.az |
| **Tripsa** | Beynəlxalq səslənir, 6 hərf | tripsa.com |
| **Yolla** | "Yola düş" hissi, yadda qalan | yolla.az |
| **Ucuztur** | Birbaşa fayda vəd edir (SEO üçün güclü) | ucuztur.az |

Ad `src/config.js` faylındadır — dəyişmək bir sətirdir. Domen seçiləndə hansıların boş olduğunu yoxlaya bilərəm.

## 2. Hazırkı MVP-də nə var

**B2C (müştəri):**
- 3 axtarış növü: tur paketi (uçuş + otel), yalnız otel, ekskursiya turları
- Xarici / Daxili (Azərbaycan) seçimi
- İstiqamət, **tarix aralığı "gediş -dan / -dək"** (maks. 14 gün; qısa yollar: dəqiq tarix, ±3, +7, +14 gün; köhnə `flex` ±gün linkləri işləyir), **gecə aralığı "-dan / -dək"** (maks. 7 fərq), böyük/uşaq, **büdcə**. Server limiti: tarix × gecə kombinasiyası ≤ 60, gediş ≤ 730 gün sonra (`config.searchLimits`)
- Nəticələr **ən ucuzdan bahalıya**; hər otel kartında bütün operatorların qiyməti yan-yana, ən ucuzu yaşıl
- "Nə qədər qənaət edirsən" göstəricisi, **erkən rezervasiya** nişanı və köhnə qiymət
- Filtrlər: qiymət, ulduz, qidalanma, operator, yalnız erkən rezervasiya
- Valyuta: AZN / USD / EUR / TRY / RUB; dil: AZ / EN / RU
- "Müraciət et" forması (lead) — agentlik/menecerə gedir
- Paylaşıla bilən axtarış linki
- **"Hara gedə bilərəm?"** — istiqamət boş qalanda büdcə/tarixə uyğun bütün istiqamətlər ən ucuz təkliflə, ucuzdan bahalıya (kart → həmin istiqamətə axtarış). API: `/api/explore` (və ya `/api/search?anywhere=1`)
- **Son dəqiqə** — 14 gün ərzində çıxış: ana səhifədə bölmə, düymə, filtr və nişan
- **Aylıq ödəniş göstəricisi** ("≈ X ₼/ay × 6 / 12", "indi 20% ödə") — DEMO vitrin, parametrlər `src/config.js` → `installment`
- **Ödəniş/ləğv şərtləri** — "İlkin ödənişsiz", "50% ilkin", "Pulsuz ləğv DD.MM-ə qədər" nişanları və filtrləri (demo məlumat, deterministik)
- **Qiymət təzəliyi** — hər mənbə üçün "X dəq əvvəl yoxlanılıb" (30 dəq yaddaş keşi) + "Yenilə"
- **Operator etibar bloku** — operator adına klik → lisenziya / üzvlük / fəaliyyət ili; bilinməyənlər "təsdiqlənməyib" (uydurma məlumat yoxdur; Summer Tour IATA/ATAA — "operatorun öz məlumatına görə")
- **Hər uşağın yaşı** (0–17) — qiymət yaşa görə: 0–1 pulsuz otel, 2–6 / 7–11 endirimli, 12+ böyük kimi (`childAges`; köhnə `children` işləyir)
- **"Sizə zəng edək"** — ana səhifədə və boş nəticədə geri zəng sorğusu (`/api/leads`, `type: 'callback'`)
- **Operator saytları səviyyəsində axtarış (SAMO-tour analoqu, DEMO məlumat):**
  - **Kurort rayonları** (Alanya: Avsallar, Konaklı, Mahmutlar…; Antalya: Lara, Kundu, Belek, Konyaaltı; Kemer, Side, Bodrum, Dubay, Şarm və s.) — hər otel bir rayonda; axtarışlı multi-select ("Hamısı" + saylar)
  - **Otel adına görə multi-select** (axtarış, "Yalnız seçilmişlər")
  - **Otel atributları:** CHD FREE (ilk 2–11 yaş uşaq otelə pulsuz), Yalnız böyüklər üçün (uşaqlı axtarışda avtomatik gizlədilir), Tövsiyə edirik, Ailəvi — nişanlar + filtrlər
  - Təklifdə **otaq tipi** (Standard Land View / Sea View / Family Room…) və **yerləşmə kodu** (DBL, DBL+1CHD(2-11.99), TRPL, +INF) pax-a görə avtomatik; 4+ nəfər → Family Room
  - **Qiymət növü** ("Erkən rezervasiya 2027" / SPO / Standart), **tur adı** ("Antalya 2027"), paketlərdə **uçuş saatı** və **sinif** (Ekonom/Biznes)
  - **Yer statusu:** otel (çox/az/yox/sorğu ilə), reys gediş/dönüş; **stop-sale**. Filtrlər: "reyslərdə yer var", "satış dayandırılmayıb" (B2C-də default), "ani təsdiq"
  - **Kartlar / Cədvəl** görünüşü (cədvəl: tarix+uçuş, tur, gecə, otel (rayon), yer, qida, otaq/yerləşmə, qiymət, qiymət növü, operator) + **"Qruplaşdır"** (otel üzrə ən ucuz)
  - **Ağıllı boş nəticə:** "Bu istiqamət üçün ekskursiya turu yoxdur" + "Tur paketinə bax" / "Yalnız otelə bax" + ekskursiya turu olan istiqamətlər; filtrlər sıfırlayanda hansı filtrin səbəb olduğu və tövsiyə ("Büdcəni 1300-ə qaldırsanız 6 təklif var")
  - **Operator məzənnəsi** ("Operator məzənnəsi 13.11.2026: USD/AZN 1.7055") — `config.operatorRate`, DEMO; USD qiymət də göstərilir. TODO: CBAR / operatorun gündəlik məzənnəsi ilə avtomatik yeniləmə
- **Ödəniş üsulları zolağı** — kart, taksit kartları, nağd (planlaşdırılır/demo) + "ödəniş birbaşa operatora gedir" izahı
- **Otel/tur P1 (RESEARCH-2 #7–#10, DEMO məlumat, deterministik):**
  - **Reytinq sözü + rəy sayı** — "Möhtəşəm 9.2 · 1 240 rəy" (9+ Möhtəşəm, 8.5+ Əla, 8+ Çox yaxşı, 7+ Yaxşı; hədlər `config.ratingWords`, EN/RU tərcümə), "DEMO" etiketi + tooltip; filtr "7+ / 8+ / 8.5+ / 9+" (`minRating`); "Reytinq" sıralaması: bal → rəy sayı → qiymət
  - **Məsafə və çimərlik xətti** — dəniz kurortlarında "1-ci / 2-ci / 3-cü xətt+" və dənizə məsafə (m), şəhərlərdə mərkəzə, dağ kurortlarında (Qəbələ, Şahdağ) kanata/ski liftinə məsafə; kartda nişan, filtrlər `beachLines` (1,2,3) və `maxDist` (m, əsas məsafəyə), sıralama "Dənizə / mərkəzə ən yaxın" (`sort=distance`); cədvəl görünüşündə və B2B "Bütün təkliflər" cədvəlində "Yerləşmə / məsafə" sütunu (sıralanır), B2B CSV-də reytinq/rəy/xətt/məsafə
  - **Otel detal pəncərəsi** — kartda otel adı və ya "Otaqlar və qiymətlər" → modal: qalereya (gallery.js), şablon əsaslı təsvir ("DEMO — rəsmi təsvir deyil"), olanaqlar, məsafələr (dəniz/kanat/mərkəz/hava limanı), reytinq, **otaq tipi × qidalanma × operator** qiymət cədvəli (ucuzdan bahalıya, şərtlər, yer statusu, "Müraciət et", "Operatorun saytında yoxla"), otel qaydaları (check-in/out, uşaq siyasəti, ev heyvanı — DEMO, "operatordan dəqiqləşdirin"). API: `GET /api/hotels/:id/offers?<axtarış parametrləri>` (id formatı + kataloq yoxlaması, 404/400, ayrıca rate limit). `?hotel=<id>` paylaşılan link; Esc, fokus tələsi, `role=dialog`; mobil: cədvəl kart görünüşündə
  - **"Necə işləyirik" səhifəsi** (`/how.html`, AZ/EN/RU) — biz satmırıq (müraciət/yönləndirmə), qiymət mənbəyi və "X dəq əvvəl yoxlanılıb", "Ən ucuz əvvəl" və digər sıralamalar ("Ən yaxşı" düsturu), ən ucuz mənbə həmişə vurğulanır, "Reklam" nişanı siyasəti (sıralamaya təsir etmir), saxta qıtlıq yoxdur, demo bəyanatı, məxfilik xülasəsi (ad/telefon; ödəniş məlumatı toplanmır), əlaqə; ana səhifə footer-ində link

**B2B (agentlik / tur menecer):** `/b2b`
- **Matris görünüşü:** sətirdə otel, sütunda operator — hansı operatorda ən ucuz olduğu bir baxışda
- Bütün təkliflər cədvəli, sütunlara görə sıralama — operator saytındakı sütunlar: tarix/uçuş saatı, tur, otel (rayon), yer statusu, otaq/yerləşmə, operator qiyməti (USD), qiymət növü, stop-sale
- Tarix/gecə aralığı, rayon və otel multi-select-ləri, otel atributları, yer/satış filtrləri; matrisdə otaq və qiymət növü (tooltip); boş nəticədə alternativlər; CSV-də yeni sütunlar
- **Komissiya / əlavə %** — müştəri qiyməti avtomatik hesablanır
- Seçilmiş variantlardan **müştəriyə hazır mətn** (operator adı gizli) → Kopyala / WhatsApp
- CSV (Excel) ixracı
- Son sorğular tarixçəsi (müştəri adı ilə)
- Uşaq yaşları, "son dəqiqə", "ilkin ödənişsiz", "pulsuz ləğv" filtrləri; cədvəldə şərtlər sütunu
- **Brendli seçim linki** (`/s/<id>`): agentlik adı ilə, operator adları və net qiymət gizli, yalnız müştəri qiyməti (komissiya daxil); müştəri "Bu variantı istəyirəm" → ad/telefon → lead agentliyə bağlanır. Id kriptoqrafik təsadüfi (72 bit), yaddaşda 30 gün, maks. 1000 seçim × 10 variant
- **"Müraciətlər"** bölməsi — seçim linklərindən gələn leadlər (DEMO: agentlik adına görə filtr; real autentifikasiya sonra)

## 3. Real qiymətləri necə gətiririk (ən vacib addım)

Hər operator üçün `src/providers/` qovluğunda ayrıca adapter yazılır. Prioritet sırası:

1. **Rəsmi API / XML feed** (ən etibarlı). Operatorların əksəriyyəti B2B rezervasiya sistemi istifadə edir — hər birindən hansı sistemdə işlədiyini və agent API girişini soruşmaq lazımdır.
2. **Agent hesabı ilə B2B portal** — razılaşma əsasında, operatorun icazəsi ilə.
3. **İctimai saytdan məlumat çəkmək (scraping)** — yalnız operatorun yazılı icazəsi ilə; həm hüquqi, həm texniki baxımdan ən zəif variant.
4. **Otellər:** Booking/Expedia kimi platformaların rəsmi partnyor (affiliate) API-ləri; Azərbaycan otelləri ilə birbaşa müqavilə və ya kanal menecerləri.

Operatorlarla danışıqda təklif: "Sizə müştəri göndəririk, satış başına komissiya" — onlar üçün də faydalıdır.

## 4. Mənim əlavə təkliflərim

1. **Qiymət xəbərdarlığı** — "Antalya 2000 ₼-dan aşağı düşəndə mənə WhatsApp/e-poçt göndər". Erkən rezervasiya açılanda avtomatik bildiriş.
2. **Qiymət tarixçəsi qrafiki** — "bu otel son 30 gündə necə dəyişib, indi almaq sərfəlidirmi?"
3. **Çevik tarix təqvimi** — ayın hər günü üçün ən ucuz qiymət (aviabilet saytlarındakı kimi).
4. **Hissə-hissə ödəniş** (Birbank, Kapital, TamKart taksit) — Azərbaycan bazarında satışı ciddi artırır.
5. **B2B abunə modeli** — agentliklər aylıq ödəyir; çoxlu menecer hesabı, sorğu CRM-i, müştəri bazası, satış statistikası.
6. **Viza və sənəd məlumatı** hər ölkə üçün (Azərbaycan vətəndaşları üçün).
7. **Rəylər və real şəkillər** — otel kartlarında.
8. **Telegram/WhatsApp bot** — "Antalya, 15 iyun, 2 nəfər, 3000 ₼" yazır, cavabda ən ucuz 3 variant.
9. **SEO səhifələri** — "Antalya turları 2027", "Qəbələ otelləri" — Google-dan pulsuz trafik.

## 5. Gəlir modeli

- B2C: operatorlardan satış komissiyası (lead və ya rezervasiya başına)
- B2B: agentliklərə aylıq abunə
- Reklam: operatorların "önə çıxarılmış təklif" yerləşdirməsi (ayrıca "Reklam" nişanı ilə — sıralamanı korlamadan)

## 6. Növbəti texniki addımlar

1. Ad + domen seçimi
2. Ilk 1–2 operatorla API razılaşması, real adapter
3. Verilənlər bazası (PostgreSQL): istifadəçilər, agentliklər, müraciətlər, qiymət keşi
4. Real B2B giriş (hesablar, rollar), admin panel
5. Hostinq (məs. Render / Railway / VPS) + domenin qoşulması + HTTPS
