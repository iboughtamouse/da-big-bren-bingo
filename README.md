# Da Big Bren Bingo

A bingo board web app for live streams. Admin creates a board, shares a link, and every viewer gets their own unique shuffled version. Mark squares MS Paint–style with freehand drawing.

**Live at:** [da-big-bren-bingo-client.vercel.app](https://da-big-bren-bingo-client.vercel.app/)

## How It Works

1. **Admin** logs in with Discord, creates a board with a pool of items
2. **Admin** shares the board link with their audience
3. Each **viewer** gets a unique deterministic shuffle of the same item pool
4. Viewers mark squares by drawing on a canvas overlay — scribble, circle, X, whatever

Boards can include a free center space, and creators can optionally customize that center text.

## Architecture

```
┌─────────────────────┐       ┌─────────────────────┐
│   Vercel (CDN)      │       │   Railway           │
│   React SPA         │──────▶│   Express API       │
│   /api/* proxy      │       │   + Postgres DB     │
└─────────────────────┘       └─────────────────────┘
```

- **Frontend:** React + Vite on Vercel — CDN-delivered, handles viewer traffic bursts
- **Backend:** Express 5 on Railway — API, Discord OAuth, board data
- **Database:** PostgreSQL on Railway — boards, items, admin users, sessions
- **Proxy:** Vercel rewrites `/api/*` to Railway, keeping cookies on the same origin

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full deep dive.

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL (local or Docker)
- A [Discord application](https://discord.com/developers/applications) with OAuth2 redirect set to `http://localhost:5173/api/auth/discord/callback`

### Setup

```bash
# Install all dependencies (root, server, client workspaces)
npm install

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, Discord credentials, etc.

# Initialize the database schema (runs automatically on server start)

# Start both server and client
npm run dev
```

This runs the Express API on `http://localhost:3000` and Vite dev server on `http://localhost:5173`. Vite proxies `/api/*` to the Express server.

### Commands

| Command              | Description                            |
| -------------------- | -------------------------------------- |
| `npm run lint`       | Run client and server lint checks      |
| `npm run build`      | Build the client app                   |
| `npm run dev`        | Start server + client simultaneously   |
| `npm run dev:server` | Start Express API only (port 3000)     |
| `npm run dev:client` | Start Vite dev server only (port 5173) |

## Project Structure

```
da-big-bren-bingo/
├── server/          # Express API (see server/README.md)
├── client/          # React SPA (see client/README.md)
├── docs/
│   ├── ARCHITECTURE.md
│   └── PRD.md
├── .env.example
└── package.json     # npm workspaces root
```

## Docs

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Stack decisions, deployment, auth flow, database schema, API design, shuffling algorithm
- [PRD.md](docs/PRD.md) — Product requirements and feature spec
- [CONTRIBUTING.md](CONTRIBUTING.md) — Collaboration style, git workflow, pull request expectations, and testing philosophy

## License

ISC
