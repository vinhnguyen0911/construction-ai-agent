# Construction AI Agent

> Smart AI assistant for construction companies — analyzes weather data and provides automated construction recommendations.

## Overview

A web-based AI chat application powered by **Google Gemini** with automatic **function calling**. The agent analyzes weather data from OpenWeatherMap and provides construction recommendations for building sites in Vietnam.

### Key Features

- **AI Chat** — Natural language Q&A in Vietnamese, agent automatically calls weather APIs when needed
- **Function Calling** — Gemini decides which tool to call based on the user's question
- **Visual Results** — Markdown tables + construction insights
- **Automated Reports** — Daily reports at 7:00 AM for 3 regions (HCMC, Dong Nai, Binh Duong)
- **Streaming Response** — Real-time display while AI is generating

## Architecture

```
┌──────────┐     ┌───────────────┐     ┌──────────────┐     ┌────────────┐
│ Browser  │────▶│ React + Vite  │────▶│ Express API  │────▶│ PostgreSQL │
│          │◀────│ (Vercel)      │◀────│ (Railway)    │◀────│ (Neon)     │
└──────────┘     └───────────────┘     └──────┬───────┘     └────────────┘
                                              │
                                    ┌─────────┴─────────┐
                                    │                   │
                               Gemini API        OpenWeatherMap
                            (Function Calling)      (Weather Data)
```

> Detailed architecture: see [docs/architecture.md](docs/architecture.md)

## Technical Decisions

| Technology | Rationale |
|---|---|
| **Google Gemini** (`gemini-2.0-flash`) | Free tier 1M tokens/day, function calling support, no credit card required |
| **Neon PostgreSQL** | Free serverless Postgres, auto-sleep when idle, quick setup |
| **Railway** | Cron job support, easy Git-based deploys, free tier available |
| **Vercel** | Optimized frontend deployment for React/Vite, free tier |
| **pnpm Workspaces** | Efficient monorepo management, disk savings via symlinks |
| **Plain JavaScript** | Fast setup, no TypeScript overhead for a small project |

## Local Setup

### Prerequisites

- Node.js >= 18
- pnpm >= 8 (`npm install -g pnpm`)

### Step 1: Get API Keys

1. **Gemini API Key**: Go to https://aistudio.google.com/apikey → Create API Key
2. **OpenWeatherMap API Key**: Sign up at https://openweathermap.org/api → Get key from API Keys page (free tier)
3. **Neon Database**: Sign up at https://console.neon.tech → Create project → Copy connection string

### Step 2: Clone and install

```bash
git clone <repo-url>
cd construction-ai-agent
pnpm install
```

### Step 3: Configure environment variables

```bash
cp .env.example .env
# Fill in API keys in .env file
```

### Step 4: Run database migration

```bash
pnpm db:migrate
```

### Step 5: Test agent (optional)

```bash
pnpm test:agent
# Runs standalone script to test Gemini function calling
```

### Step 6: Run the application

```bash
pnpm dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

### Login Credentials

- Username: `admin`
- Password: `admin`

## Agent Functions

| Function | Description | API Source |
|---|---|---|
| `get_current_weather` | Get current weather (temperature, humidity, wind, description) | OpenWeatherMap Current |
| `get_weather_forecast` | Get 1-5 day forecast (aggregated by day) | OpenWeatherMap Forecast |

### Adding New Functions

To add a new tool for the agent (e.g. `get_material_price`, `get_exchange_rate`):

1. Create a new file in `apps/api/src/tools/` (e.g. `material.js`)
2. Export `declaration` (Gemini function schema) and `execute` function
3. Import and register in `apps/api/src/tools/index.js`
4. Update system instruction in `apps/api/src/agent/prompt.js` if needed

```javascript
// apps/api/src/tools/material.js
export const declaration = {
  name: 'get_material_price',
  description: 'Get current construction material prices',
  parameters: {
    type: 'object',
    properties: {
      material: { type: 'string', description: 'Material name (cement, steel, sand...)' },
    },
    required: ['material'],
  },
};

export async function execute({ material }) {
  // Call API or query database
  // return { material, price, unit, updated_at }
}
```

## Deploy

### Frontend → Vercel

1. Import repo on Vercel
2. Root Directory: `apps/web`
3. Build Command: `pnpm build`
4. Output Directory: `dist`
5. Environment: add `VITE_API_URL` = Railway backend URL

### Backend → Railway

1. Import repo on Railway
2. Root Directory: `apps/api`
3. Start Command: `node src/index.js`
4. Environment: add all variables from `.env.example`

### Database → Neon

1. Create project on Neon Dashboard
2. Copy connection string to `DATABASE_URL`
3. Run migration: `pnpm db:migrate`

### Railway Free Tier Note

Railway free tier containers may sleep after inactivity, which can cause cron jobs to be missed. Solutions:
- Upgrade to Developer plan ($5/month)
- Use GitHub Actions cron to call `POST /api/reports/run` endpoint as a manual trigger

## Sample Questions

- "Thoi tiet hom nay o Ho Chi Minh the nao?"
- "Du bao thoi tiet 3 ngay toi tai Bien Hoa"
- "Hom nay co nen do be tong o Thu Dau Mot khong?"
- "So sanh thoi tiet tuan nay giua TPHCM va Dong Nai"

## Screenshots

<!-- TODO: Add screenshots after UI is finalized -->

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Lucide Icons, react-markdown
- **Backend**: Node.js, Express, pg, node-cron
- **AI**: Google Gemini 2.0 Flash (function calling)
- **Database**: PostgreSQL (Neon)
- **Monorepo**: pnpm workspaces
