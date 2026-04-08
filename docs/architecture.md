# Kiến trúc hệ thống — Construction AI Agent

## Tổng quan

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

## Flow chi tiết

### 1. Chat Flow (Function Calling)

```
User nhập câu hỏi
    │
    ▼
Frontend gửi POST /api/chat (SSE streaming)
    │
    ▼
Backend nhận message, lưu vào DB
    │
    ▼
Gửi lên Gemini API kèm:
  - System instruction (vai trò trợ lý xây dựng)
  - Chat history
  - Function declarations (get_current_weather, get_weather_forecast)
    │
    ▼
Gemini phân tích câu hỏi
    │
    ├── Trả về text → Stream về Frontend → Hiển thị
    │
    └── Trả về functionCall
            │
            ▼
        Backend execute function:
          - get_current_weather → gọi OpenWeatherMap Current API
          - get_weather_forecast → gọi OpenWeatherMap Forecast API
            │
            ▼
        Gửi functionResponse về Gemini
            │
            ▼
        Gemini phân tích data, tạo bảng + insight
            │
            ▼
        Stream text response về Frontend
            │
            ▼
        Lưu assistant message vào DB
```

### 2. Daily Report Flow

```
node-cron trigger lúc 7:00 AM (Asia/Ho_Chi_Minh)
    │
    ▼
Với mỗi location: ["Ho Chi Minh City", "Bien Hoa", "Thu Dau Mot"]
    │
    ▼
Gọi agent với prompt template
    │
    ▼
Agent thực hiện function calling (giống Chat Flow)
    │
    ▼
Lưu kết quả vào bảng daily_reports
    │
    ▼
Frontend Tab B đọc từ GET /api/reports
```

### 3. Authentication Flow

```
POST /api/auth/login (username, password)
    │
    ▼
So sánh với credentials cứng (admin/admin)
    │
    ▼
Trả về JWT token
    │
    ▼
Frontend lưu localStorage
    │
    ▼
Mọi request kèm header: Authorization: Bearer <token>
    │
    ▼
Middleware verify JWT → cho phép hoặc từ chối
```

## Cấu trúc thư mục Backend

```
apps/api/src/
├── index.js              # Entry point, khởi tạo Express + cron
├── db/
│   ├── pool.js           # PostgreSQL connection pool
│   └── migrate.js        # Script tạo tables
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── routes/
│   ├── auth.js           # POST /api/auth/login
│   ├── chat.js           # POST /api/chat, GET /api/conversations
│   └── reports.js        # GET /api/reports, POST /api/reports/run
├── agent/
│   ├── index.js          # Agent loop chính (Gemini + function calling)
│   └── prompt.js         # System instruction
├── tools/
│   ├── index.js          # Registry: khai báo + map function executors
│   ├── weather.js        # get_current_weather, get_weather_forecast
│   └── [future-tool].js  # Dễ mở rộng: thêm file, register vào index
└── scheduler/
    └── daily-report.js   # node-cron job
```

## Cấu trúc thư mục Frontend

```
apps/web/src/
├── main.jsx
├── App.jsx               # Router + Layout
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── Layout.jsx        # Sidebar + main content
│   ├── ChatSidebar.jsx   # Danh sách conversations
│   ├── ChatWindow.jsx    # Khung chat chính
│   ├── MessageBubble.jsx # Render 1 message (markdown support)
│   └── ReportCard.jsx    # Card hiển thị 1 report
├── pages/
│   ├── Login.jsx
│   ├── Chat.jsx
│   └── Reports.jsx
├── hooks/
│   └── useAuth.js        # Auth context + JWT management
└── lib/
    └── api.js            # Fetch wrapper với auth header
```

## Database Schema

```sql
conversations (id UUID PK, title, created_at, updated_at)
    │
    └──< messages (id UUID PK, conversation_id FK, role, content, function_calls JSONB, created_at)

daily_reports (id UUID PK, location, report_date, content, created_at)
```

## Mở rộng Tool mới

Để thêm 1 function mới cho agent (VD: `get_material_price`):

1. Tạo file `apps/api/src/tools/material.js` — export function declaration + executor
2. Import và register vào `apps/api/src/tools/index.js`
3. Cập nhật system instruction nếu cần

Agent sẽ tự động nhận diện tool mới qua function declarations gửi lên Gemini.
