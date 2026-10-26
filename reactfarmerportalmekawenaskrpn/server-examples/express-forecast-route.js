// Example Express route: React → Express → FastAPI (ML model)
// Mount in your Express app:  app.use('/api/forecast', require('./express-forecast-route'));
// Needs Node 18+ (built-in fetch). Set ML_API_URL, e.g. http://localhost:8000

const express = require('express');
const router = express.Router();

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

router.get('/tanks/:tankId', async (req, res) => {
  const days = Math.min(30, Math.max(1, Number(req.query.days) || 14));
  try {
    const r = await fetch(`${ML_API_URL}/predict/${encodeURIComponent(req.params.tankId)}?days=${days}`);
    if (!r.ok) return res.status(502).json({ error: `Model service returned ${r.status}` });
    const data = await r.json();
    res.set('Cache-Control', 'public, max-age=600'); // forecasts change slowly
    res.json(data);
  } catch (err) {
    res.status(503).json({ error: 'Model service unreachable', detail: err.message });
  }
});

module.exports = router;

// Remember CORS if the React app runs on another port:
//   const cors = require('cors'); app.use(cors({ origin: 'http://localhost:5173' }));
