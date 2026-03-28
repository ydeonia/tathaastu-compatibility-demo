import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually (no dotenv dependency for ESM simplicity)
try {
  const envFile = readFileSync(resolve(__dirname, '.env'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && !key.startsWith('#')) process.env[key.trim()] = val.join('=').trim();
  });
} catch { /* .env not found, rely on system env vars */ }

const API_KEY = process.env.TATHAASTU_API_KEY;
const API_URL = process.env.TATHAASTU_API_URL || 'https://api.tathaastuapi.com';
const PORT = process.env.PORT || 3001;

if (!API_KEY) {
  console.error('TATHAASTU_API_KEY not set. Create a .env file with your API key.');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Proxy: GET /api/compatibility/score -> GET api.tathaastuapi.com/v1/compatibility/score
app.get('/api/compatibility/score', async (req, res) => {
  try {
    const params = new URLSearchParams(req.query).toString();
    const response = await fetch(`${API_URL}/v1/compatibility/score?${params}`, {
      headers: {
        'X-API-Key': API_KEY,
        'x-demo-app': 'compatibility-demo'
      }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'API request failed', detail: err.message });
  }
});

// Proxy: POST /api/compatibility/report -> POST api.tathaastuapi.com/v1/compatibility/report
app.post('/api/compatibility/report', async (req, res) => {
  try {
    const response = await fetch(`${API_URL}/v1/compatibility/report`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'x-demo-app': 'compatibility-demo',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'API request failed', detail: err.message });
  }
});

// Proxy: POST /api/compatibility/pdf -> POST api.tathaastuapi.com/v1/kundli/premium-report
app.post('/api/compatibility/pdf', async (req, res) => {
  try {
    const response = await fetch(`${API_URL}/v1/kundli/premium-report`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'x-demo-app': 'compatibility-demo',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'API request failed', detail: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', api_url: API_URL, demo: 'compatibility-demo' });
});

// In production: serve the built React app
app.use(express.static(resolve(__dirname, 'dist')));
app.use((req, res) => {
  res.sendFile(resolve(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Proxying to: ${API_URL}`);
});
