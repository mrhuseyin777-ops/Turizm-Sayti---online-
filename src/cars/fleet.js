// DEMO avtomobil kataloqu, icarə şirkətləri və transfer sinifləri.
// Model adları yalnız nümunədir ("... və ya oxşar") — icarədə konkret model zəmanət verilmir.
// Şirkət adları UYDURMADIR (real brendlər deyil). Real inteqrasiyada bu fayl
// partnyorların API/feed məlumatı ilə əvəz olunacaq.

const CATEGORIES = [
  { id: 'economy', label: 'Ekonom', icon: '🚗' },
  { id: 'compact', label: 'Kompakt', icon: '🚙' },
  { id: 'midsize', label: 'Orta sinif', icon: '🚘' },
  { id: 'suv', label: 'SUV / krossover', icon: '🚙' },
  { id: 'minivan', label: 'Minivan (7–9 yer)', icon: '🚐' },
  { id: 'premium', label: 'Premium', icon: '🏎️' },
  { id: 'electric', label: 'Elektrik', icon: '⚡' },
];

// base — gündəlik baza qiyməti (AZN, aşağı mövsüm, Türkiyə səviyyəsi)
// deposit — standart depozit (AZN); bags — böyük çamadan sayı
const MODELS = [
  { id: 'hyundai-i10', category: 'economy', name: 'Hyundai i10', seats: 4, doors: 5, bags: 1, smallBags: 1, transmission: 'manual', fuel: 'petrol', base: 38, deposit: 300 },
  { id: 'renault-clio', category: 'economy', name: 'Renault Clio', seats: 5, doors: 5, bags: 1, smallBags: 2, transmission: 'manual', fuel: 'diesel', base: 42, deposit: 350 },
  { id: 'fiat-egea-at', category: 'economy', name: 'Fiat Egea Sedan', seats: 5, doors: 4, bags: 2, smallBags: 1, transmission: 'automatic', fuel: 'petrol', base: 47, deposit: 350 },
  { id: 'toyota-corolla', category: 'compact', name: 'Toyota Corolla', seats: 5, doors: 4, bags: 2, smallBags: 2, transmission: 'automatic', fuel: 'hybrid', base: 58, deposit: 450 },
  { id: 'vw-golf', category: 'compact', name: 'Volkswagen Golf', seats: 5, doors: 5, bags: 2, smallBags: 1, transmission: 'automatic', fuel: 'diesel', base: 62, deposit: 450 },
  { id: 'skoda-octavia', category: 'midsize', name: 'Skoda Octavia', seats: 5, doors: 5, bags: 3, smallBags: 2, transmission: 'automatic', fuel: 'diesel', base: 74, deposit: 550 },
  { id: 'toyota-camry', category: 'midsize', name: 'Toyota Camry', seats: 5, doors: 4, bags: 3, smallBags: 2, transmission: 'automatic', fuel: 'hybrid', base: 88, deposit: 650 },
  { id: 'dacia-duster', category: 'suv', name: 'Dacia Duster', seats: 5, doors: 5, bags: 2, smallBags: 2, transmission: 'manual', fuel: 'diesel', base: 66, deposit: 500 },
  { id: 'nissan-qashqai', category: 'suv', name: 'Nissan Qashqai', seats: 5, doors: 5, bags: 3, smallBags: 1, transmission: 'automatic', fuel: 'petrol', base: 82, deposit: 600 },
  { id: 'toyota-rav4', category: 'suv', name: 'Toyota RAV4', seats: 5, doors: 5, bags: 3, smallBags: 2, transmission: 'automatic', fuel: 'hybrid', base: 98, deposit: 750 },
  { id: 'kia-carnival', category: 'minivan', name: 'Kia Carnival', seats: 7, doors: 5, bags: 4, smallBags: 2, transmission: 'automatic', fuel: 'diesel', base: 118, deposit: 800 },
  { id: 'ford-tourneo', category: 'minivan', name: 'Ford Tourneo Custom', seats: 9, doors: 4, bags: 5, smallBags: 3, transmission: 'manual', fuel: 'diesel', base: 122, deposit: 850 },
  { id: 'mercedes-vito', category: 'minivan', name: 'Mercedes-Benz Vito Tourer', seats: 8, doors: 4, bags: 5, smallBags: 2, transmission: 'automatic', fuel: 'diesel', base: 145, deposit: 1000 },
  { id: 'mercedes-e', category: 'premium', name: 'Mercedes-Benz E-Class', seats: 5, doors: 4, bags: 3, smallBags: 1, transmission: 'automatic', fuel: 'diesel', base: 175, deposit: 1500 },
  { id: 'bmw-5', category: 'premium', name: 'BMW 5 Series', seats: 5, doors: 4, bags: 3, smallBags: 1, transmission: 'automatic', fuel: 'petrol', base: 185, deposit: 1500 },
  { id: 'tesla-m3', category: 'electric', name: 'Tesla Model 3', seats: 5, doors: 4, bags: 2, smallBags: 2, transmission: 'automatic', fuel: 'electric', base: 105, deposit: 900 },
  { id: 'byd-atto3', category: 'electric', name: 'BYD Atto 3', seats: 5, doors: 5, bags: 2, smallBags: 1, transmission: 'automatic', fuel: 'electric', base: 88, deposit: 700 },
];

// Uydurma DEMO icarə şirkətləri.
// insurance: daxil olan sığorta — 'cdw' (françizalı) və ya 'full' (françizasız tam)
// km: null = limitsiz, rəqəm = gündəlik km limiti
// oneWayPerKm / oneWayMin — fərqli yerdə qaytarma haqqı
// young: 25 yaşdan aşağı sürücü üçün gündəlik əlavə; minAge — minimal yaş
// countries — işlədiyi ölkələr; fleet — hansı kateqoriyalar var
const COMPANIES = [
  {
    id: 'sahil', name: 'Sahil Rent', color: '#0ea5e9', bias: 1.0, coverage: 0.85, insurance: 'cdw', km: null, freeCancel: true,
    depositFactor: 1.0, oneWayPerKm: 0.35, oneWayMin: 35, sameCityFee: 0, young: 12, minAge: 21,
    extras: { childSeat: 7, gps: 6, extraDriver: 9 }, countries: ['Türkiyə', 'Gürcüstan', 'Azərbaycan'],
    fleet: ['economy', 'compact', 'midsize', 'suv', 'minivan'],
  },
  {
    id: 'zirve', name: 'Zirvə Avto', color: '#f97316', bias: 0.93, coverage: 0.8, insurance: 'cdw', km: 250, freeCancel: false,
    depositFactor: 1.2, oneWayPerKm: 0.3, oneWayMin: 30, sameCityFee: 10, young: 15, minAge: 21,
    extras: { childSeat: 5, gps: 5, extraDriver: 7 }, countries: ['Türkiyə', 'Azərbaycan', 'Gürcüstan', 'Misir'],
    fleet: ['economy', 'compact', 'midsize', 'suv', 'minivan'],
  },
  {
    id: 'karvan', name: 'Karvan Car Hire', color: '#8b5cf6', bias: 1.12, coverage: 0.9, insurance: 'full', km: null, freeCancel: true,
    depositFactor: 0.5, oneWayPerKm: 0.4, oneWayMin: 45, sameCityFee: 0, young: 18, minAge: 23,
    extras: { childSeat: 9, gps: 8, extraDriver: 0 }, countries: ['Türkiyə', 'BƏƏ', 'Azərbaycan', 'Gürcüstan'],
    fleet: ['compact', 'midsize', 'suv', 'minivan', 'premium', 'electric'],
  },
  {
    id: 'bulud', name: 'Bulud Drive', color: '#14b8a6', bias: 1.04, coverage: 0.85, insurance: 'full', km: null, freeCancel: true,
    depositFactor: 0.7, oneWayPerKm: 0.32, oneWayMin: 40, sameCityFee: 15, young: 14, minAge: 22,
    extras: { childSeat: 8, gps: 7, extraDriver: 8 }, countries: ['BƏƏ', 'Türkiyə', 'Misir'],
    fleet: ['economy', 'compact', 'midsize', 'suv', 'premium', 'electric'],
  },
  {
    id: 'ulduz', name: 'Ulduz Rent-a-Car', color: '#e11d48', bias: 0.97, coverage: 0.95, insurance: 'cdw', km: 300, freeCancel: true,
    depositFactor: 0.9, oneWayPerKm: 0.25, oneWayMin: 25, sameCityFee: 0, young: 10, minAge: 21,
    extras: { childSeat: 6, gps: 5, extraDriver: 6 }, countries: ['Azərbaycan', 'Gürcüstan'],
    fleet: ['economy', 'compact', 'midsize', 'suv', 'minivan', 'premium', 'electric'],
  },
];

// Ölkəyə görə qiymət əmsalı (AZN bazasına nisbətən)
const COUNTRY_FACTOR = { 'Türkiyə': 1.0, 'BƏƏ': 1.35, 'Misir': 0.9, 'Gürcüstan': 0.85, 'Azərbaycan': 0.9 };

// Mövsüm əmsalları (Yan–Dek): dəniz kurortları yayda, Azərbaycan daxili yay + qış (xizək)
const SEASON = {
  beach: [0.7, 0.7, 0.75, 0.85, 1.0, 1.3, 1.5, 1.55, 1.2, 0.95, 0.75, 0.85],
  gulf: [1.25, 1.25, 1.15, 1.0, 0.8, 0.7, 0.7, 0.7, 0.8, 1.0, 1.2, 1.35], // Dubay — qışda pik
  city: [0.85, 0.85, 0.95, 1.05, 1.1, 1.15, 1.2, 1.2, 1.1, 1.05, 0.9, 1.0],
  domestic: [1.05, 1.1, 0.85, 0.9, 1.0, 1.2, 1.35, 1.35, 1.05, 0.9, 0.85, 1.15],
};
const SEASON_OF = {
  antalya: 'beach', alanya: 'beach', kemer: 'beach', side: 'beach', bodrum: 'beach', batumi: 'beach', sharm: 'city',
  dubai: 'gulf', istanbul: 'city', tbilisi: 'city',
  qabala: 'domestic', shahdag: 'domestic', sheki: 'domestic', lankaran: 'domestic', baku: 'domestic', naftalan: 'domestic',
};

// Transfer (sürücülü maşın) sinifləri. capacity — maks. nəfər, bags — maks. çamadan.
// base — minimum (AZN), perKm — km başına, perDay — günlük sürücülü (8 saat)
const TRANSFER_CLASSES = [
  { id: 'sedan', label: 'Sedan', example: 'Toyota Camry və ya oxşar', capacity: 3, bags: 3, base: 35, perKm: 0.85, perDay: 160, vip: false },
  { id: 'minivan', label: 'Minivan', example: 'Mercedes-Benz Vito və ya oxşar', capacity: 7, bags: 7, base: 55, perKm: 1.15, perDay: 230, vip: false },
  { id: 'vip', label: 'VIP', example: 'Mercedes-Benz V-Class / E-Class və ya oxşar', capacity: 6, bags: 6, base: 95, perKm: 1.9, perDay: 380, vip: true },
  { id: 'minibus', label: 'Mikroavtobus', example: 'Mercedes-Benz Sprinter və ya oxşar', capacity: 16, bags: 16, base: 90, perKm: 1.7, perDay: 340, vip: false },
];

// Uydurma DEMO transfer şirkətləri
const TRANSFER_COMPANIES = [
  { id: 'yolcu', name: 'Yolçu Transfer', color: '#0ea5e9', bias: 1.0, countries: ['Türkiyə', 'Azərbaycan', 'Gürcüstan'], freeCancelHours: 24, meetGreet: true },
  { id: 'menzil', name: 'Mənzil Shuttle', color: '#f59e0b', bias: 0.94, countries: ['Türkiyə', 'Misir', 'BƏƏ', 'Azərbaycan'], freeCancelHours: 48, meetGreet: false },
  { id: 'ipek', name: 'İpək Yolu Driver', color: '#a855f7', bias: 1.09, countries: ['Azərbaycan', 'Gürcüstan', 'BƏƏ', 'Türkiyə'], freeCancelHours: 24, meetGreet: true },
];

module.exports = { CATEGORIES, MODELS, COMPANIES, COUNTRY_FACTOR, SEASON, SEASON_OF, TRANSFER_CLASSES, TRANSFER_COMPANIES };
