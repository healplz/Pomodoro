# Pomodoro

A Next.js Pomodoro timer app with Google OAuth, drag-to-set timer, task tracking, dots, and daily streaks.

## Tech Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **SQLite** via Drizzle ORM + better-sqlite3
- **Auth.js v5** with Google OAuth
- **Framer Motion** for drag interactions

## Local Development

### 1. Environment variables

Create `.env.local`:

```env
AUTH_SECRET=        # openssl rand -base64 32
AUTH_GOOGLE_ID=     # from Google Cloud Console
AUTH_GOOGLE_SECRET= # from Google Cloud Console
```

Google OAuth redirect URI: `http://localhost:3000/api/auth/callback/google`

### 2. Database

```bash
npm run db:migrate
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Scripts

```bash
npm run db:generate  # generate migrations from schema changes
npm run db:migrate   # apply migrations
npm run db:studio    # open Drizzle Studio
```

## Tests

```bash
npm test             # run all tests
npm test -- --coverage
```

122 tests across 13 suites, ~91% statement coverage.

## Deployment

This app uses **SQLite with better-sqlite3**, which requires a **persistent filesystem**. It is **not compatible with serverless platforms** (Vercel, Netlify, Cloudflare Pages) without first migrating to a hosted database like PostgreSQL or Turso.

Recommended host: **[Railway](https://railway.app)** — supports persistent volumes, auto-deploys from GitHub, and requires no database changes.

### Railway setup

1. Connect your GitHub repo in the Railway dashboard
2. Add the same environment variables from `.env.local` as Railway service variables
3. Add a startup command so the DB is initialized on first deploy:
   ```
   npm run db:migrate && npm start
   ```
