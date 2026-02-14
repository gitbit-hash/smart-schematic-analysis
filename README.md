# Smart Schematic Analysis Platform

AI-powered SaaS platform that transforms static PDF schematics into **interactive, searchable engineering intelligence** — component detection, OCR text extraction, connectivity graphs, BOM generation, and semantic search.

**Target users:** Repair technicians · Hardware engineers · Electronics hobbyists

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), Tailwind CSS v4, TypeScript |
| **Database** | PostgreSQL + Prisma 7 |
| **Auth** | NextAuth.js v5 (Google OAuth + Credentials) |
| **AI Pipeline** | Python FastAPI — YOLOv8, EasyOCR, L-CNN |
| **File Storage** | S3 / Cloudflare R2 |
| **Queue** | BullMQ + Redis |
| **Deployment** | Vercel (web) + GPU cloud (AI service) |

---

## Project Structure

```
smart-schematic-analysis/
├── app/
│   ├── (auth)/               # Login, Register pages
│   ├── (dashboard)/          # Protected app pages
│   │   ├── dashboard/        # Overview + stats
│   │   ├── schematics/       # List + upload
│   │   ├── viewer/[id]/      # Interactive viewer (Phase 2)
│   │   └── settings/         # Account + subscription
│   ├── api/
│   │   ├── auth/             # NextAuth + registration
│   │   ├── schematics/       # CRUD + search
│   │   ├── upload/           # Presigned URL generation
│   │   └── webhooks/         # Stripe + AI callbacks
│   └── layout.tsx
├── components/
│   ├── providers/            # Auth provider
│   └── ui/                   # Sidebar, Header, Logo
├── lib/
│   ├── prisma.ts             # DB client singleton
│   ├── auth.ts               # Auth.js config
│   └── ai-service.ts         # Python service HTTP client
├── prisma/
│   ├── schema.prisma         # Database models
│   └── generated/            # Generated Prisma client
├── ai-service/               # Python FastAPI (separate deploy)
│   ├── main.py               # FastAPI app
│   ├── pipeline/             # AI processing modules
│   ├── requirements.txt
│   └── Dockerfile
├── prisma.config.ts          # Prisma 7 CLI config
└── docker-compose.yml        # Local dev: Postgres + Redis + AI
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL, NEXTAUTH_SECRET, etc.
```

### 3. Start database (Docker)

```bash
docker-compose up -d postgres redis
```

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Generate Prisma client

```bash
npx prisma generate
```

### 6. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 7. Start AI service (optional)

```bash
docker-compose up -d ai-service
```

---

## AI Pipeline

The Python AI service processes schematics through a multi-stage pipeline:

1. **PDF → Images** — PyMuPDF rasterization at 300 DPI
2. **Component Detection** — YOLOv8 (trained on schematic symbols)
3. **Wire Extraction** — L-CNN for line/connection detection
4. **Text Recognition** — EasyOCR with CRAFT backbone
5. **Post-processing** — Text-to-component association + connectivity graph

---

## Subscription Tiers

| Tier | Schematics | Price | Key Features |
|---|---|---|---|
| Free | ≤50 | $0 | Basic OCR, limited search |
| Basic | ≤500 | $19–29/mo | Full search, single-distributor BOM |
| Professional | ≤5,000 | $79–149/mo | Net tracing, multi-distributor BOM, API |
| Team | Unlimited | $299–499/mo | Collaboration, priority processing |

---

## Development Roadmap

- **Phase 1** (Mo 1–2): Foundation — Auth, DB, upload, AI scaffold ✅ *In progress*
- **Phase 2** (Mo 3–4): Core — Interactive viewer, search, BOM generation
- **Phase 3** (Mo 5–6): Polish — Dashboard analytics, billing, launch

---

## License

Private — All rights reserved.
