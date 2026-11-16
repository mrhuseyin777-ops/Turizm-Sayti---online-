// Aviabilet satış mənbələrinin (provayderlərin) qeydiyyatı.
// Real inteqrasiya hazır olanda müvafiq createDemoFlightProvider(...) sətrini real adapterlə
// əvəz edin (məs. require('./amadeusAdapter')). Bax: docs/FLIGHTS.md
//
// Adlar qəsdən ümumidir — hamısı DEMO mənbədir, real şirkət deyil.

const { createDemoFlightProvider } = require('./demoProvider');

const LCC = ['PC', 'VF', 'W6', 'G9']; // lowcost-ların çoxu klassik GDS-də satılmır

const flightProviders = [
  createDemoFlightProvider({ id: 'demo-direct', name: 'Aviaşirkət saytı (DEMO)', color: '#0ea5e9', kind: 'airline', bias: 1.0, fee: 0, coverage: 1, spread: 0.02 }),
  createDemoFlightProvider({ id: 'demo-gds', name: 'GDS Konsolidator (DEMO)', color: '#8b5cf6', kind: 'gds', bias: 0.965, fee: 8, coverage: 0.9, excludeCarriers: LCC }),
  createDemoFlightProvider({ id: 'demo-ota-a', name: 'OTA Partner A (DEMO)', color: '#f59e0b', kind: 'ota', bias: 0.975, fee: 5, coverage: 0.8 }),
  createDemoFlightProvider({ id: 'demo-ota-b', name: 'OTA Partner B (DEMO)', color: '#ef4444', kind: 'ota', bias: 0.99, fee: 0, coverage: 0.7, spread: 0.1, onlyCheapestFamily: true }),
];

module.exports = { flightProviders };
