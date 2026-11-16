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
    providers: providers.map(({ id, name, color, kind, demo, sells }) => ({ id, name, color, kind, demo, sells })),
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

// Sorğu / müraciət (B2C müştəri "Müraciət et" düyməsi). Real versiyada DB + e-poçt/WhatsApp bildirişi.
const leads = [];
app.post('/api/leads', (req, res) => {
  const { name, phone, offerId, note } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: 'Ad və telefon tələb olunur' });
  const lead = { id: leads.length + 1, name: String(name).slice(0, 80), phone: String(phone).slice(0, 30), offerId, note: String(note || '').slice(0, 500), createdAt: new Date().toISOString() };
  leads.push(lead);
  res.json({ ok: true, id: lead.id });
});

app.get('/b2b', (req, res) => res.sendFile(path.join(__dirname, 'public', 'b2b.html')));

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`${config.brand.name} işləyir: http://localhost:${port}`));
}

module.exports = app;
