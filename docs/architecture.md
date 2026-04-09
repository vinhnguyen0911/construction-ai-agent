# System Architecture — Construction AI Agent

## Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Browser    │────▶│  React Frontend  │────▶│  Express API     │────▶│  PostgreSQL      │
│   (User)     │◀────│  (Vercel)        │◀────│  (Railway)       │◀────│  (Neon)          │
└─────────────┘     └──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                                      │
                                              ┌───────┴────────┐
                                              │                │
                                     ┌────────▼──────┐  ┌─────▼──────────────┐
                                     │  Gemini API   │  │  OpenWeatherMap    │
                                     │  (AI Agent)   │  │  API               │
                                     └───────────────┘  └────────────────────┘
```

## Detailed Flows

### 1. Chat Flow (Function Calling)

```
User enters a question
    │
    ▼
Frontend sends POST /api/chat (SSE streaming)
    │
    ▼
Backend receives message, saves to DB
    │
    ▼
Sends to Gemini API with:
  - System instruction (construction assistant role)
  - Chat history
  - Function declarations (get_current_weather, get_weather_forecast)
    │
    ▼
Gemini analyzes the question
    │
    ├── Returns text → Stream to Frontend → Display
    │
    └── Returns functionCall
            │
            ▼
        Backend executes function:
          - get_current_weather → calls OpenWeatherMap Current API
          - get_weather_forecast → calls OpenWeatherMap Forecast API
            │
            ▼
        Sends functionResponse back to Gemini
            │
            ▼
        Gemini analyzes data, creates table + insights
            │
            ▼
        Streams text response to Frontend
            │
            ▼
        Saves assistant message to DB
```

### 2. Daily Report Flow

```
node-cron triggers at 7:00 AM (Asia/Ho_Chi_Minh)
    │
    ▼
For each location: ["Ho Chi Minh City", "Bien Hoa", "Thu Dau Mot"]
    │
    ▼
Calls agent with prompt template
    │
    ▼
Agent performs function calling (same as Chat Flow)
    │
    ▼
Saves result to daily_reports table
    │
    ▼
Frontend Reports tab reads from GET /api/reports
```

### 3. Authentication Flow

```
POST /api/auth/login (username, password)
    │
    ▼
Compare with hardcoded credentials (admin/admin)
    │
    ▼
Return JWT token
    │
    ▼
Frontend stores in localStorage
    │
    ▼
All requests include header: Authorization: Bearer <token>
    │
    ▼
Middleware verifies JWT → allow or deny
```

## Backend Directory Structure

```
apps/api/src/
├── index.js              # Entry point, initializes Express + cron
├── db/
│   ├── pool.js           # PostgreSQL connection pool
│   └── migrate.js        # Table creation script
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── routes/
│   ├── auth.js           # POST /api/auth/login
│   ├── chat.js           # POST /api/chat, GET /api/conversations
│   └── reports.js        # GET /api/reports, POST /api/reports/run
├── agent/
│   ├── index.js          # Main agent loop (Gemini + function calling)
│   └── prompt.js         # System instruction
├── tools/
│   ├── index.js          # Registry: declarations + executor map
│   ├── weather.js        # get_current_weather, get_weather_forecast
│   └── [future-tool].js  # Easily extensible: add file, register in index
└── scheduler/
    └── daily-report.js   # node-cron job
```

## Frontend Directory Structure

```
apps/web/src/
├── main.jsx
├── App.jsx               # Router + Layout
├── components/
│   ├── Layout.jsx        # Sidebar + main content
│   ├── ChatSidebar.jsx   # Conversation list
│   ├── ChatWindow.jsx    # Main chat window
│   ├── MessageBubble.jsx # Render single message (markdown support)
│   └── ReportCard.jsx    # Card displaying a single report
├── pages/
│   ├── Login.jsx
│   ├── Chat.jsx
│   └── Reports.jsx
├── hooks/
│   └── useAuth.jsx       # Auth context + JWT management
└── lib/
    ├── api.js            # Fetch wrapper with auth header
    └── cn.js             # Tailwind class merge utility
```

## Database Schema

```sql
conversations (id UUID PK, title, created_at, updated_at)
    │
    └──< messages (id UUID PK, conversation_id FK, role, content, function_calls JSONB, created_at)

daily_reports (id UUID PK, location, report_date, content, created_at)
```

## Adding a New Tool

To add a new function for the agent (e.g. `get_material_price`):

1. Create file `apps/api/src/tools/material.js` — export function declaration + executor
2. Import and register in `apps/api/src/tools/index.js`
3. Update system instruction if needed

The agent will automatically recognize the new tool via function declarations sent to Gemini.
