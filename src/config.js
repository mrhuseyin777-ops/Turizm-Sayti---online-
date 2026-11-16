// Brend və əsas parametrlər — ad dəyişəndə yalnız burada dəyişmək kifayətdir.
module.exports = {
  brand: {
    name: 'TurTap',
    slogan: 'Bütün tur operatorları bir axtarışda — ən ucuzdan bahalıya.',
    domain: 'turtap.az', // hələ alınmayıb, nümunədir
  },
  // Valyuta məzənnələri (AZN bazası). Real versiyada CBAR-dan gündəlik çəkilməlidir.
  rates: { AZN: 1, USD: 0.588, EUR: 0.54, TRY: 20.1, RUB: 52 },
  defaultCurrency: 'AZN',
  departureCity: 'Bakı',
  // Axtarışda tarix çevikliyi (± gün)
  flexibleDays: 3,
};
