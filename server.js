const express = require('express');
const path = require('path');
const config = require('./src/config');
const { search, suggest } = require('./src/search');
const { providers } = require('./src/providers');
const { boardLabels } = require('./src/data/catalog');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (req, res) => {
  res.json({
    brand: config.brand,
    currencies: Object.keys(config.rates),
    boards: boardLabels,
    providers: providers.map(({ id, name, color, kind, demo, sells, trust }) => ({ id, name, color, kind, demo, sells, trust })),
    installment: config.installment,
    lastMinuteDays: config.lastMinuteDays,
  });
});

app.get('/api/suggest', (req, res) => res.json(suggest(req.query.q)));

app.get('/api/search', async (req, res) => {
  try {
    res.json(await search(req.query));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Müraciətlər (/api/leads), B2B seçim linkləri və /api/explore: src/routes/tours.js

// Modullar (aviabilet, avtomobil və s.): src/routes/*.js faylları avtomatik qoşulur.
// Hər fayl express.Router() export edir və öz yollarını (/api/<modul>/...) özü təyin edir.
const fs = require('fs');
const routesDir = path.join(__dirname, 'src', 'routes');
if (fs.existsSync(routesDir)) {
  for (const f of fs.readdirSync(routesDir).filter((x) => x.endsWith('.js')).sort()) {
    app.use(require(path.join(routesDir, f)));
  }
}

app.get('/b2b', (req, res) => res.sendFile(path.join(__dirname, 'public', 'b2b.html')));

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`${config.brand.name} işləyir: http://localhost:${port}`));
}

module.exports = app;
