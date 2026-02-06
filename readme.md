# AV Insights Dashboard

**Comprehensive Project Handoff — Current Checkpoint**

This document summarizes everything completed so far on the **AV Insights Dashboard** project so another developer (or AI assistant) can continue immediately without clarifying questions.

It reflects the latest stable checkpoint, including:
- RSS ingestion (hybrid sources: Google News + direct publishers)
- Full-text extraction (integrated and working)
- AI processing pipeline
- Scheduling and concurrency control
- REST API endpoints with advanced analytics
- Observability and logging

---

## 1) Project Goal & Scope

### Primary Goal

Build an **AI-powered Autonomous Vehicle (AV) Insights Dashboard** that continuously ingests AV-related content and transforms it into structured, queryable intelligence.

### Article Data Model (Target)

Each article ultimately contains:

- `title`
- `url`
- `published_at`
- `source`
- `raw_content`
- `cleaned_content`

### AI Enrichment (Persisted per Article)

- Bullet summary
- Category (e.g. safety, regulation, autonomy, OEMs)
- Company mentions
- Sentiment
- Impact score
- Regulatory relevance (boolean)
- AV relevance (boolean)
- Relevance score (0–1)
- Themes / tags

---

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account with database setup
- OpenAI API key

### Installation
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials
```

### Run Everything
```bash
# Start all services (API + schedulers)
npm start
```

This launches:
- **REST API** on http://localhost:3001
- **RSS ingestion** (runs immediately, then hourly)
- **AI processing** (every 10 minutes)

Press **Ctrl+C** to stop all services.

For individual service control, see [Appendix A - Commands](#appendix-a--commands).

---

## 2) MVP Outcomes (Implemented & Working)

- Config-driven RSS ingestion via database-managed sources
- Hybrid RSS sources (Google News + TechCrunch + The Verge + Electrek + FreightWaves)
- Full-text extraction for direct publisher feeds
- Deduplicated article storage (unique `url`)
- Cleaned article text persisted to DB
- AI processing pipeline using Postgres as a queue
- DB-backed AI status lifecycle (`pending → processing → done/skipped/error`)
- Cost control via heuristic + model-based relevance gating
- Atomic concurrency-safe article claiming via Postgres RPC
- Ingestion and AI worker schedulers
- Ingestion logging + runtime observability
- **REST API with 15+ endpoints** for dashboard integration
- Advanced analytics (trending themes, company momentum, co-mentions, timeline)
- Source performance metrics and regulatory insights

---

## 3) Not Yet Implemented (Phase 2+)

- Dashboard UI (Next.js / React) - **IN PROGRESS**
- Monthly executive-style reports (Markdown/PDF)
- Production deployment & monitoring
- Full Google News URL resolution (currently best-effort)
- Advanced visualizations (network graphs, heat maps)

---

## 4) Technology Stack

### Backend / Runtime
- Node.js (ES Modules)
- Local development in VS Code
- GitHub for version control
- Copilot-assisted development

### Database / Persistence
- Supabase (PostgreSQL)
- SQL editor for schema and RPC functions
- Postgres used as both datastore and work queue

### Key Libraries
- `@supabase/supabase-js`
- `rss-parser`
- `dotenv`
- `node-cron`
- OpenAI official SDK (Responses API)

### AI Provider
- OpenAI Responses API
- Structured output via `json_schema`
- Current model: `gpt-4o-mini`
  - Used due to org verification limits on higher-tier models

---

## 5) Backend Repository Structure
```
av-insights-backend/
├─ src/
│ ├─ db/
│ │ └─ supabaseClient.js
│ ├─ ingest/
│ │ └─ rssIngest.js
│ ├─ processors/
│ │ └─ analyzeArticles.js
│ ├─ llm/
│ │ ├─ openaiClient.js
│ │ └─ articleSchema.js
│ ├─ api/
│ │ ├─ server.js
│ │ ├─ queries.js
│ │ ├─ testQueries.js
│ │ └─ testNewEndpoints.js
│ ├─ utils/
│ │ ├─ logger.js
│ │ ├─ cleanText.js
│ │ ├─ avRelevanceHeuristic.js
│ │ └─ extractFullText.js
│ ├─ index.js
│ ├─ scheduler.js
│ └─ aiScheduler.js
├─ package.json
├─ .gitignore
└─ .env (local only)
```



---


## 6) Entry Points

- `src/index.js` — manual RSS ingestion run
- `src/scheduler.js` — hourly RSS ingestion scheduler
- `src/processors/analyzeArticles.js` — AI worker (article analysis)
- `src/aiScheduler.js` — AI worker scheduler (every 10 mins)
- `src/api/server.js` — REST API server (port 3001)


---


## 7) Environment Variables


### Required

SUPABASE_URL
SUPABASE_ANON_KEY (or SERVICE_ROLE key if RLS enabled)
OPENAI_API_KEY
OPENAI_MODEL=gpt-4o-mini



### Operational Tuning

```
OPENAI_MAX_INPUT_CHARS=8000
OPENAI_MAX_OUTPUT_TOKENS=350
OPENAI_MAX_RETRIES=4

AV_RELEVANCE_THRESHOLD=0.55
AI_BATCH_SIZE=5
AI_STUCK_PROCESSING_MINUTES=30

# Full-text extraction
FULLTEXT_ENABLED=true
FULLTEXT_MIN_SNIPPET_CHARS=400
FULLTEXT_MIN_EXTRACTED_CHARS=800
FULLTEXT_MAX_PER_FEED=5
FULLTEXT_DEBUG=false
FULLTEXT_TIMEOUT_MS=12000

# API server
API_PORT=3001
```



⚠️ Every scheduler or worker entry point **must import**:
```js
import "dotenv/config";
8) Database Schema (Supabase)
sources

Manages ingestion sources without code changes.

Fields:

id (uuid, PK)

name

type (rss)

url (unique)

active

created_at

articles

Single source of truth for:

raw content

cleaned content

AI-enriched data
Also functions as the processing queue.

Key fields:

url (unique)

raw_content

cleaned_content

ai_status (pending | processing | done | skipped | error)

AI output fields (JSON + scalars)

processed_at

error_message

ingestion_logs

Observability for ingestion runs.

Fields:

source_id

status

message

meta (JSONB)

created_at

9) Critical RPC Function
claim_pending_articles(batch_size int)

Atomically:

Selects pending rows

Locks them using FOR UPDATE SKIP LOCKED

Marks them as processing

Returns claimed rows to the worker

This is the core concurrency-safety mechanism.

10) Data Ingestion
Implemented

RSS ingestion via rss-parser

Active sources fetched from DB

Articles upserted using url as dedupe key

Text cleaned and persisted

Ingestion logs written per source

Scheduling

Runs immediately on startup

Then hourly via node-cron

In-process lock prevents overlapping runs

**Known Limitation**

RSS snippets (especially Google News) are short — full-text extraction helps with direct publisher feeds

**Hybrid Sources Strategy**

- Google News feeds: provide broad coverage (short snippets)
- Direct publishers (TechCrunch, The Verge, Electrek, FreightWaves): richer content
- Full-text extraction enabled for direct feeds (2000-3000+ chars)

## 11) Full-Text Extraction ✅
**utils/extractFullText.js**

Fully integrated into RSS ingestion pipeline:

- Fetches and extracts full article content using JSdom + Readability
- Attempts to resolve Google News redirect URLs (best-effort)
- Sequential processing with per-feed limits to avoid rate limiting
- Environment-configurable thresholds and toggles
- Successfully extracting 2000-3000+ character articles from direct publishers
- Dramatically improves AI enrichment quality (4x better company extraction)

12) AI Processing Pipeline
Worker Flow

Reset stuck processing rows

Claim batch via RPC

Heuristic AV relevance filter

OpenAI structured JSON analysis

Model-based relevance gating

Persist results or mark as skipped/error

Cost Control

Heuristic filter removes obvious non-AV content early

Model relevance gate prevents low-value articles from polluting insights

13) AI Worker Scheduling

Runs immediately + every 10 minutes

Uses node-cron

In-process lock prevents overlap

Safe to scale horizontally due to DB locking

Current throughput: ~30 articles/hour (5 articles × 6 runs)

## 14) Current Status

### Completed ✅

- **Core Pipeline**
  - Schema & constraints
  - RSS ingestion (hybrid sources)
  - Full-text extraction (integrated)
  - Text cleaning & normalization
  - Logging & ingestion tracking

- **AI Processing**
  - AI worker & scheduler
  - Atomic queue claiming via RPC
  - Retry & stuck-processing handling
  - Heuristic + model-based relevance gating
  - Cost controls

- **REST API**
  - Express server (15+ endpoints)
  - Dashboard statistics
  - Article queries with filters
  - Company analytics (top mentions, momentum, co-mentions)
  - Trending themes & timeline
  - Featured articles
  - Source performance metrics
  - Regulatory insights
  - Search functionality

- **Quality Validation**
  - 180+ articles processed
  - 100% relevance rate (filters working)
  - 2941 char extractions from TechCrunch
  - 10 companies tracked with momentum
  - All endpoints tested & returning data

### In Progress 🚧

- Frontend dashboard (Next.js) - **READY TO START**
- Throughput optimization
- Additional RSS sources

### Future Enhancements 📋

- Production deployment & monitoring
- Executive reports (Markdown/PDF)
- Advanced visualizations
- Full Google News URL resolution

---

## 15) Current Checkpoint - Backend Complete! 🎉

**Status:** Backend development is complete and fully operational.

### What's Working

- **Ingestion:** Hybrid RSS sources (Google News + direct publishers) with full-text extraction
- **AI Pipeline:** Processing 180+ articles with high-quality enrichment
- **REST API:** 15+ endpoints serving dashboard-ready data
- **Quality:** 100% relevance rate, 2941-char extractions, accurate company tracking

### Recommended Next Steps

1. **Build Frontend Dashboard** (Next.js)
   - Overview page with metrics and featured articles
   - Companies page with leaderboard and momentum
   - Articles page with browsing and search
   - Insights page with trends and analytics

2. **Deploy to Production**
   - Backend API (Railway, Fly.io, or similar)
   - Frontend (Vercel)
   - Set up monitoring

3. **Optimize & Scale**
   - Add more direct RSS publishers
   - Tune AI throughput vs ingestion rate
   - Implement caching layer

---

## Appendix A — Commands

### Production (All Services)
```bash
npm start              # Start all services (API + RSS + AI schedulers)
```

This runs:
- REST API server on port 3001
- RSS ingestion scheduler (hourly)
- AI processing scheduler (every 10 mins)

Press **Ctrl+C** to stop all services gracefully.

### Individual Services (Development)
```bash
# Ingestion
npm run ingest:once    # Manual RSS ingestion (one-time run)
npm run schedule       # RSS ingestion scheduler only

# AI Processing
npm run process:ai     # Manual AI processing (one-time run)
npm run schedule:ai    # AI worker scheduler only

# API Server
npm run api            # REST API server only

# Testing
npm run test:queries   # Test basic query functions
npm run test:analytics # Test all analytics endpoints
```

---

## Appendix B — API Endpoints

**Base URL:** `http://localhost:3001`

### Core Endpoints
- `GET /api/stats?days=7` - Dashboard metrics
- `GET /api/articles?limit=20&category=safety` - Recent articles with filters
- `GET /api/companies?limit=10&days=30` - Top companies by mentions
- `GET /api/categories?days=30` - Category breakdown
- `GET /api/sentiment?days=30` - Sentiment distribution
- `GET /api/search?q=Tesla&limit=20` - Search articles

### Analytics
- `GET /api/trends/themes?limit=15&days=7` - Trending themes
- `GET /api/trends/timeline?days=30` - Activity timeline
- `GET /api/featured?limit=10&days=7` - High-impact featured articles
- `GET /api/companies/momentum?limit=10` - Company momentum (trending up/down)
- `GET /api/companies/co-mentions?limit=10&days=30` - Company co-mentions
- `GET /api/sources?days=30` - Source performance metrics
- `GET /api/regulatory?limit=10&days=30` - Regulatory insights

---

## Appendix C — Monitoring SQL

```sql
-- Check AI processing status
SELECT ai_status, COUNT(*) FROM articles GROUP BY ai_status;

-- Recent article volume
SELECT 
  DATE_TRUNC('hour', fetched_at) as hour,
  COUNT(*) as count
FROM articles
GROUP BY 1
ORDER BY 1 DESC;

-- Top companies by mentions
SELECT 
  company,
  COUNT(*) as mentions
FROM articles,
  LATERAL JSONB_ARRAY_ELEMENTS_TEXT(ai_companies) AS company
WHERE ai_status = 'done'
  AND ai_av_relevance = true
GROUP BY 1
ORDER BY 2 DESC
LIMIT 20;

-- Content length by source
SELECT 
  s.name,
  COUNT(*) as articles,
  AVG(LENGTH(a.cleaned_content))::int as avg_chars
FROM articles a
JOIN sources s ON a.source_id = s.id
WHERE a.ai_status = 'done'
GROUP BY s.name
ORDER BY articles DESC;
```

---

## Appendix D — Known Footguns & Lessons

### Critical
- **Missing `dotenv/config`** causes silent env misreads → always import at entry points
- **Backlog management:** AI throughput must ≥ ingestion rate or queue grows
- **Sequential processing:** Full-text extraction uses sequential processing to avoid rate limiting

### Quality
- **Short RSS snippets** reduce AI quality → use hybrid sources (Google + direct publishers)
- **Full-text extraction** dramatically improves enrichment (4x better company extraction)
- **Google News URLs** are wrappers, not direct articles → best-effort resolution only

### Performance  
- **Batch size vs throughput:** Balance AI_BATCH_SIZE with processing frequency
- **Per-feed limits:** FULLTEXT_MAX_PER_FEED prevents overwhelming any single publisher
- **Stuck processing timeout:** AI_STUCK_PROCESSING_MINUTES should account for retry delays

### Development
- **Test queries frequently:** Use `npm run test:queries` and `npm run test:analytics`
- **Monitor the queue:** Watch `pending` count to ensure processing keeps up
- **API CORS:** Already configured for local frontend development



