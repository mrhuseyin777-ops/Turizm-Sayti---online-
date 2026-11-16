# TurTap — məhsul planı

## 1. Ad təklifləri

| Ad | Mənası / niyə | Domen ideyası |
|---|---|---|
| **TurTap** ⭐ (işçi ad) | "Tur tap" — azərbaycanca aydındır, xarici dildə də asan oxunur, qısa | turtap.az / turtap.com |
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
- İstiqamət, tarix (±3 gün çevik), gecə sayı, böyük/uşaq, **büdcə**
- Nəticələr **ən ucuzdan bahalıya**; hər otel kartında bütün operatorların qiyməti yan-yana, ən ucuzu yaşıl
- "Nə qədər qənaət edirsən" göstəricisi, **erkən rezervasiya** nişanı və köhnə qiymət
- Filtrlər: qiymət, ulduz, qidalanma, operator, yalnız erkən rezervasiya
- Valyuta: AZN / USD / EUR / TRY / RUB; dil: AZ / EN / RU
- "Müraciət et" forması (lead) — agentlik/menecerə gedir
- Paylaşıla bilən axtarış linki

**B2B (agentlik / tur menecer):** `/b2b`
- **Matris görünüşü:** sətirdə otel, sütunda operator — hansı operatorda ən ucuz olduğu bir baxışda
- Bütün təkliflər cədvəli, sütunlara görə sıralama
- **Komissiya / əlavə %** — müştəri qiyməti avtomatik hesablanır
- Seçilmiş variantlardan **müştəriyə hazır mətn** (operator adı gizli) → Kopyala / WhatsApp
- CSV (Excel) ixracı
- Son sorğular tarixçəsi (müştəri adı ilə)

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
