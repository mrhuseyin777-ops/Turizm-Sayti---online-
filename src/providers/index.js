// Bütün mənbələrin (tur operatorları və otel mənbələri) qeydiyyatı.
// Real inteqrasiya hazır olanda müvafiq createMockProvider(...) sətrini
// həmin operatorun real adapteri ilə əvəz edin (məs. require('./summerTour')).

const { createMockProvider } = require('./mockProvider');

const providers = [
  createMockProvider({ id: 'summer', name: 'Summer Tour', color: '#f59e0b', bias: 1.0, coverage: 0.8, early: { minDaysAhead: 60, discount: 0.2 } }),
  createMockProvider({ id: 'funsun', name: 'Funsun Travel', color: '#ef4444', bias: 0.98, coverage: 0.75, early: { minDaysAhead: 75, discount: 0.18 } }),
  createMockProvider({ id: 'kompas', name: 'Kompas Travel', color: '#3b82f6', bias: 1.03, coverage: 0.7, early: { minDaysAhead: 45, discount: 0.15 } }),
  createMockProvider({ id: 'samatur', name: 'Samatur', color: '#10b981', bias: 0.99, coverage: 0.65, early: { minDaysAhead: 90, discount: 0.25 } }),
  // Yalnız otel satan mənbələr (Booking tipli / birbaşa otel müqavilələri)
  createMockProvider({ id: 'hotels-direct', name: 'Otel (birbaşa)', color: '#8b5cf6', kind: 'hotel', bias: 1.06, coverage: 0.9, sells: ['hotel'] }),
  createMockProvider({ id: 'local-az', name: 'Yerli otellər AZ', color: '#14b8a6', kind: 'hotel', bias: 0.95, coverage: 1, sells: ['hotel', 'tour'], regions: ['domestic'] }),
];

module.exports = { providers };
