# TathaAstu Compatibility Demo

A React demo app that uses the [TathaAstu API](https://tathaastuapi.com) to check Vedic astrology compatibility (Kundli Matching) between two people.

## Security

This project uses a **backend proxy** to protect API keys. The API key is stored server-side in `.env` and is **never exposed to the frontend**. The React app calls the Express backend, which adds the API key and forwards requests to the TathaAstu API.

```
Browser (React) --> Express Backend (adds API key) --> TathaAstu API
```

**Do NOT expose your API key in frontend code.**

## Features

- Input bride and groom birth details (DOB, time, location)
- **Score** - Ashtakoot Guna Milan score with animated ring chart
- **Report** - Full human-readable compatibility insights
- **PDF** - Downloadable Kundli PDF report
- Koota breakdown (Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi)
- Domain scores with progress bars (Emotional, Romantic, Marriage, Children, Finance, Soul)
- Dosha detection (Manglik, Nadi, Bhakoot)

## Quick Start

### 1. Get an API Key

Sign up at [tathaastuapi.com/dashboard](https://tathaastuapi.com/dashboard) (free tier: 1,000 requests/month).

### 2. Clone and Install

```bash
git clone https://github.com/nicksahdev/tathaastu-compatibility-demo.git
cd tathaastu-compatibility-demo
npm install
```

### 3. Configure

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```
TATHAASTU_API_KEY=your_api_key_here
TATHAASTU_API_URL=https://api.tathaastuapi.com
PORT=3001
```

### 4. Run (Development)

Start the backend proxy and React dev server:

```bash
# Terminal 1: Start backend proxy
npm run dev:backend

# Terminal 2: Start React dev server
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Run (Production)

```bash
npm run build
npm start
```

Open [http://localhost:3001](http://localhost:3001)

## Architecture

```
Frontend (React + Vite)          Backend (Express)              TathaAstu API
========================         =====================          ====================
/compatibility/score    ----->   GET  /api/compat/score  ----->  /v1/compatibility/score
/compatibility/report   ----->   POST /api/compat/report ----->  /v1/compatibility/report
/compatibility/pdf      ----->   POST /api/compat/pdf    ----->  /v1/kundli/premium-report
```

- Frontend has **zero API keys** - all requests go through the backend proxy
- Backend adds `X-API-Key` and `x-demo-app` headers
- In dev: Vite proxies `/api/*` to Express on port 3001
- In prod: Express serves both the built React app and the API proxy

## API Documentation

- [Full Docs](https://tathaastuapi.com/docs.html)
- [API Reference](https://docs.tathaastuapi.com)
- [OpenAPI Spec](https://api.tathaastuapi.com/openapi.json)

## Tech Stack

- React 19 + Vite (frontend)
- Express (backend proxy)
- TathaAstu API (live, no mocks)
- No external UI libraries (vanilla CSS)

## License

MIT

---

Built with [TathaAstu API](https://tathaastuapi.com) - The World's Most Comprehensive Hindu Panchang API
