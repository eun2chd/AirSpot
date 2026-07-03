import express from 'express';
import { registerFlight, getTodayStatus } from './flights.js';

const PORT = 4001;
const app = express();
app.use(express.json());

app.get('/api/flights/today', (req, res) => {
  res.json(getTodayStatus());
});

app.post('/api/flights', (req, res) => {
  const { name, desc, link } = req.body ?? {};

  if (typeof name !== 'string' || !name.trim() || name.trim().length > 20) {
    return res.status(400).json({ error: 'name' });
  }
  if (typeof desc !== 'string' || !desc.trim() || desc.trim().length > 40) {
    return res.status(400).json({ error: 'desc' });
  }
  if (link != null && link !== '') {
    if (typeof link !== 'string' || !/^https?:\/\//.test(link) || link.length > 200) {
      return res.status(400).json({ error: 'link' });
    }
  }

  const result = registerFlight({ name: name.trim(), desc: desc.trim(), link: link ? link.trim() : null });
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`[server] API on http://localhost:${PORT}`);
});
