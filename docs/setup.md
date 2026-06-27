# Setup

## Prerequisites

- Node.js 18+ and pnpm
- Python 3.11+
- PostgreSQL database (local or [Neon](https://neon.tech) free tier)

## Environment variables

### API (`api/.env`)

```env
DATABASE_URL=postgresql://user:password@host/db
JWT_SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-key          # Google AI Studio
OPENWEATHER_API_KEY=your-openweather-key
AI_PROVIDER=gemini                       # only supported value right now
FLASK_ENV=development
```

### Frontend (`.env.local` at root)

```env
NEXT_PUBLIC_API_URL=http://localhost:5328
```

## Install dependencies

```bash
# Frontend
pnpm install

# API
cd api
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

## Database

```bash
cd api
flask db upgrade   # runs all Alembic migrations
python seed.py     # seeds default categories (optional)
```

## Run locally

Two terminals:

```bash
# Terminal 1 — Flask API (port 5328)
cd api && flask run --port 5328

# Terminal 2 — Next.js frontend (port 3000)
pnpm dev
```

Or use Vercel CLI to run both together:

```bash
vercel dev -L
```

## API checks

```bash
cd api
make lint        # ruff check
make typecheck   # basedpyright
make check       # both
make format      # ruff format
```
