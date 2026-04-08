# 🏗️ Construction AI Agent

> Trợ lý AI thông minh cho công ty xây dựng — phân tích thời tiết và đưa ra khuyến nghị thi công tự động.

## Tổng quan

Ứng dụng web chat AI tích hợp **Google Gemini** với khả năng **function calling** tự động. Agent phân tích dữ liệu thời tiết từ OpenWeatherMap và đưa ra khuyến nghị thi công phù hợp cho các công trình xây dựng tại Việt Nam.

### Tính năng chính

- 💬 **Chat AI** — Hỏi đáp tự nhiên bằng tiếng Việt, agent tự gọi API thời tiết khi cần
- 🔧 **Function Calling** — Gemini tự quyết định gọi tool nào dựa trên câu hỏi
- 📊 **Kết quả trực quan** — Bảng markdown + insight khuyến nghị thi công
- 📅 **Báo cáo tự động** — Chạy hàng ngày lúc 7h sáng cho 3 khu vực (TPHCM, Đồng Nai, Bình Dương)
- 🔄 **Streaming response** — Hiển thị realtime khi AI đang trả lời

## Kiến trúc

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

> Chi tiết kiến trúc: xem [docs/architecture.md](docs/architecture.md)

## Technical Decisions

| Công nghệ | Lý do chọn |
|---|---|
| **Google Gemini** (`gemini-2.0-flash`) | Free tier 1M tokens/ngày, hỗ trợ function calling, không cần thẻ tín dụng |
| **Neon PostgreSQL** | Serverless Postgres miễn phí, auto-sleep khi không dùng, setup nhanh |
| **Railway** | Hỗ trợ cron jobs, deploy dễ dàng từ Git, có free tier |
| **Vercel** | Deploy frontend tối ưu cho React/Vite, free tier |
| **pnpm Workspaces** | Monorepo management hiệu quả, tiết kiệm disk với symlinks |
| **JavaScript thuần** | Nhanh setup, không overhead TypeScript cho dự án nhỏ |

## Cài đặt Local

### Yêu cầu

- Node.js >= 18
- pnpm >= 8 (`npm install -g pnpm`)

### Bước 1: Lấy API Keys

1. **Gemini API Key**: Truy cập https://aistudio.google.com/apikey → Create API Key
2. **OpenWeatherMap API Key**: Đăng ký tại https://openweathermap.org/api → Lấy key từ trang API Keys (free tier)
3. **Neon Database**: Đăng ký tại https://console.neon.tech → Tạo project → Copy connection string

### Bước 2: Clone và cài đặt

```bash
git clone <repo-url>
cd construction-ai-agent
pnpm install
```

### Bước 3: Cấu hình biến môi trường

```bash
cp .env.example .env
# Điền các API keys vào file .env
```

### Bước 4: Chạy migration tạo database tables

```bash
pnpm db:migrate
```

### Bước 5: Test agent (tùy chọn)

```bash
pnpm test:agent
# Chạy script standalone test Gemini function calling
```

### Bước 6: Chạy ứng dụng

```bash
pnpm dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

### Đăng nhập

- Username: `admin`
- Password: `admin`

## Agent Functions

| Function | Mô tả | API Source |
|---|---|---|
| `get_current_weather` | Lấy thời tiết hiện tại (nhiệt độ, độ ẩm, gió, mô tả) | OpenWeatherMap Current |
| `get_weather_forecast` | Lấy dự báo thời tiết 1-5 ngày (aggregate theo ngày) | OpenWeatherMap Forecast |

### Mở rộng thêm Function mới

Để thêm 1 tool mới cho agent (ví dụ: `get_material_price`, `get_exchange_rate`):

1. Tạo file mới trong `apps/api/src/tools/` (ví dụ: `material.js`)
2. Export `declaration` (Gemini function schema) và `execute` function
3. Import và register vào `apps/api/src/tools/index.js`
4. Cập nhật system instruction trong `apps/api/src/agent/prompt.js` nếu cần

```javascript
// apps/api/src/tools/material.js
export const declaration = {
  name: 'get_material_price',
  description: 'Lấy giá vật liệu xây dựng hiện tại',
  parameters: {
    type: 'object',
    properties: {
      material: { type: 'string', description: 'Tên vật liệu (xi măng, thép, cát...)' },
    },
    required: ['material'],
  },
};

export async function execute({ material }) {
  // Gọi API hoặc tra cứu database
  // return { material, price, unit, updated_at }
}
```

## Deploy

### Frontend → Vercel

1. Import repo trên Vercel
2. Root Directory: `apps/web`
3. Build Command: `pnpm build`
4. Output Directory: `dist`
5. Environment: thêm `VITE_API_URL` = URL backend Railway

### Backend → Railway

1. Import repo trên Railway
2. Root Directory: `apps/api`
3. Start Command: `node src/index.js`
4. Environment: thêm tất cả biến từ `.env.example`

### Database → Neon

1. Tạo project trên Neon Dashboard
2. Copy connection string vào `DATABASE_URL`
3. Chạy migration: `pnpm db:migrate`

### Lưu ý Railway Free Tier

Railway free tier container có thể sleep sau thời gian không hoạt động, khiến cron job có thể bị miss. Giải pháp:
- Upgrade lên Developer plan ($5/tháng)
- Hoặc dùng GitHub Actions cron gọi endpoint `POST /api/reports/run` để trigger thủ công

## Câu hỏi mẫu để test

- "Thời tiết hôm nay ở Hồ Chí Minh thế nào?"
- "Dự báo thời tiết 3 ngày tới tại Biên Hòa"
- "Hôm nay có nên đổ bê tông ở Thủ Dầu Một không?"
- "So sánh thời tiết tuần này giữa TPHCM và Đồng Nai"

## Screenshots

<!-- TODO: Thêm screenshots sau khi hoàn thiện UI -->

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, shadcn/ui, react-markdown
- **Backend**: Node.js, Express, pg, node-cron
- **AI**: Google Gemini 2.0 Flash (function calling)
- **Database**: PostgreSQL (Neon)
- **Monorepo**: pnpm workspaces
