# Railwatch — Payment Operations Monitor

Technical assessment built for the AI-First Product Owner role at Nymbus. A real-time payment ops dashboard for community banks and credit unions. **Live demo** at https://railwatch-payment-ops-monitor.vercel.app.

- **GitHub:** https://github.com/ttague222/Railwatch-Payment-Ops-Monitor
- **Assessment doc:** `AI-First Product Owner - Take Home Assessment.md`
- **Decision log:** `ai-collaboration-context.md`

## Structure

```
Railwatch/
├── railwatch/       # React + TypeScript frontend (Vite)
│   └── src/
│       ├── api/         # FRED, Frankfurter, Marketaux integrations
│       ├── components/  # Dashboard components (rail health, exceptions, settlement, etc.)
│       ├── context/     # CutOffContext, DataProviderContext, MarketauxContext
│       ├── providers/   # SimulatorDataProvider
│       ├── simulator/   # Realistic payment data simulation engine
│       ├── types/       # TypeScript interfaces
│       └── utils/
└── api/             # Vercel serverless functions — proxy for FRED and Marketaux (CORS bypass)
    ├── fred/
    ├── marketaux/
    └── frankfurter/
```

## Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Recharts
- **Deployment:** Vercel (serverless functions for API proxying)
- **APIs:** FRED (Fed rate), Frankfurter (FX), Marketaux (payments news)
- **Testing:** Vitest, Testing Library, Playwright (E2E)

## Key Architecture Pattern
All dashboard components consume payment data through a `DataProvider` interface. `SimulatorDataProvider` powers demo mode. In production, a `NymbusConnectDataProvider` would implement the same interface — zero changes to consuming components.

## Running Locally

```bash
cd railwatch
npm install
cp .env.example .env.local   # add VITE_FRED_API_KEY and VITE_MARKETAUX_API_TOKEN (optional)
npm run dev                   # http://localhost:5173
```

## Key Notes
- All payment data is simulated — safe to run without any API keys
- Market context (Fed rate, FX, news) requires API keys but fails gracefully without them
- FRED and Marketaux calls are proxied via `api/` to bypass CORS
