# Architecture — Da Big Bren Bingo

## System Overview

```
┌─────────────────────┐       ┌─────────────────────┐
│                     │       │                     │
│   Vercel (CDN)      │       │   Railway           │
│   React SPA         │──────▶│   Express API       │
│   Static assets     │       │   + Postgres DB     │
│                     │       │                     │
└─────────────────────┘       └─────────────────────┘
        ▲                             │
        │                             │
   Viewers &                    Discord OAuth
   Admin (browser)              (via Discord API)
```

**Frontend:** React + Vite, deployed to Vercel. Served from CDN edge nodes for fast global delivery and zero load on the API server.

**Backend:** Express.js, deployed to Railway. Handles API requests, Discord OAuth, and serves board data.

**Database:** PostgreSQL, managed by Railway. Stores boards, items, and admin identity.

## Deployment

| Component | Platform | Plan                                | Purpose              |
| --------- | -------- | ----------------------------------- | -------------------- |
| Frontend  | Vercel   | Free tier (or $20/mo existing plan) | CDN-hosted React SPA |
| API       | Railway  | Hobby ($5/mo)                       | Express server       |
| Database  | Railway  | Hobby (included)                    | PostgreSQL           |

### Why this split?

- Stream link drops can send 50–500 users simultaneously. Vercel CDN handles the static asset burst without breaking a sweat. Railway only sees API calls (lightweight JSON), not file serving.
- Railway hobby plan has limited compute. Offloading static assets to Vercel keeps it focused on what matters.

### Cross-Origin Proxy

Vercel rewrites `/api/*` requests to the Railway backend (configured in `client/vercel.json`). This keeps all traffic on the same origin from the browser's perspective, which is critical for session cookies — browsers block third-party cookies even with `SameSite=None`. The Express server sets `trust proxy` so it correctly sees proxied requests as HTTPS.

## Authentication

### Admin: Discord OAuth 2.0

- Uses the Authorization Code Grant flow
- Flow: Admin clicks "Log in with Discord" → redirected to Discord → authorizes → redirected back with code → backend exchanges code for access token → fetches Discord user ID/username → creates session
- Session stored server-side in Postgres (via `connect-pg-simple`) with a secure httpOnly cookie — sessions survive deploys/restarts
- Board ownership tied to Discord user ID

### Viewer: Anonymous

- On first visit to a board, the frontend generates a UUID v4 and stores it in localStorage
- This visitor ID is sent with API requests to seed the board shuffle
- No authentication, no cookies from the server, no friction

## Database Schema

```sql
-- Admin users (populated on Discord OAuth login)
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    discord_id    VARCHAR(255) UNIQUE NOT NULL,
    username      VARCHAR(255) NOT NULL,
    avatar        VARCHAR(255),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Bingo boards
CREATE TABLE boards (
    id            VARCHAR(12) PRIMARY KEY,  -- short URL-safe ID (nanoid)
    user_id       INTEGER NOT NULL REFERENCES users(id),
    title         VARCHAR(255) NOT NULL,
    free_space    BOOLEAN DEFAULT true,
    free_space_text VARCHAR(255),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Item pool for each board
CREATE TABLE board_items (
    id            SERIAL PRIMARY KEY,
    board_id      VARCHAR(12) NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    text          VARCHAR(255) NOT NULL,
    sort_order    INTEGER NOT NULL,  -- preserves admin's original ordering
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### Why no "visitor" or "marked squares" table?

Visitor state (which squares are marked) is stored entirely in the visitor's localStorage. This keeps the backend stateless with respect to viewers — critical for handling traffic bursts without database pressure. Downside: clearing browser data loses your marks. Acceptable for MVP.

## API Design

### Auth

| Method | Path                         | Description                                |
| ------ | ---------------------------- | ------------------------------------------ |
| GET    | `/api/auth/discord`          | Redirect to Discord OAuth                  |
| GET    | `/api/auth/discord/callback` | Handle OAuth callback, create session      |
| GET    | `/api/auth/me`               | Return current authenticated user (or 401) |
| POST   | `/api/auth/logout`           | Destroy session                            |

### Boards

| Method | Path              | Description                              |
| ------ | ----------------- | ---------------------------------------- |
| GET    | `/api/boards`     | List boards for current user (auth required) |
| POST   | `/api/boards`     | Create a new board (auth required)       |
| GET    | `/api/boards/:id` | Get board metadata + full item pool      |
| PUT    | `/api/boards/:id` | Update board (auth required, owner only) |
| DELETE | `/api/boards/:id` | Delete board (auth required, owner only) |

### Board Viewing

| Method | Path                                       | Description                            |
| ------ | ------------------------------------------ | -------------------------------------- |
| GET    | `/api/boards/:id/play?visitor=<visitorId>` | Get shuffled 5×5 grid for this visitor |

## Shuffling Algorithm

The shuffling must be **deterministic** — the same visitor ID + board ID must always produce the same board. This is achieved using a seeded pseudo-random number generator (PRNG).

```
seed = hash(boardId + visitorId + board.updatedAt)
rng  = seededRandom(seed)

if pool.length > slotsNeeded:
    selected = seededSample(pool, slotsNeeded, rng)
else:
    selected = pool

grid = seededShuffle(selected, rng)

if freeSpace:
    grid[12] = freeSpaceText || "FREE"  // center of 5×5 (index 12)
```

Including `board.updatedAt` in the seed means that if the admin edits the board, everyone gets a fresh shuffle. This is intentional — prevents stale boards after edits.

## Frontend Routing

| Route             | Component   | Purpose                                         |
| ----------------- | ----------- | ----------------------------------------------- |
| `/`               | Home        | Landing page, "Create a Board" CTA              |
| `/create`         | BoardEditor | Create a new board (auth required)              |
| `/board/:id/edit` | BoardEditor | Edit existing board (auth required, owner only) |
| `/board/:id`      | BoardPlay   | Viewer experience — shuffled board + marking    |

Discord login is initiated via a link in the Header (`<a href="/api/auth/discord">`) — there is no dedicated login page.

## Project Structure

```
da-big-bren-bingo/
├── docs/
│   ├── PRD.md
│   └── ARCHITECTURE.md
├── server/                  # Express backend
│   ├── index.js             # Entry point
│   ├── env.js               # dotenv loader
│   ├── db/
│   │   ├── connection.js    # Postgres connection
│   │   └── schema.sql       # DDL
│   ├── routes/
│   │   ├── auth.js          # Discord OAuth routes
│   │   └── boards.js        # Board CRUD + play
│   ├── middleware/
│   │   └── auth.js          # Session/auth middleware
│   └── lib/
│       └── shuffle.js       # Deterministic shuffle logic
├── client/                  # React + Vite frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── BoardEditor.jsx
│   │   │   └── BoardPlay.jsx
│   │   ├── components/
│   │   │   ├── BingoGrid.jsx
│   │   │   ├── DrawingCanvas.jsx  # Konva canvas overlay + toolbar
│   │   │   ├── Footer.jsx         # Retro footer
│   │   │   └── Header.jsx
│   │   └── lib/
│   │       └── api.js       # API client
│   └── public/
├── package.json             # Root package (workspace)
├── railway.json             # Railway deployment config
└── .env.example             # Environment variable template
```

## Key Technical Decisions

| Decision         | Choice                            | Rationale                                                    |
| ---------------- | --------------------------------- | ------------------------------------------------------------ |
| Frontend hosting | Vercel                            | CDN edge delivery, handles burst traffic, already paid       |
| Backend hosting  | Railway                           | Persistent server, managed Postgres, simple deploy           |
| Database         | PostgreSQL                        | Reliable, Railway-native, no filesystem concerns             |
| Admin auth       | Discord OAuth                     | Stream-safe (no secrets on screen), familiar to audience     |
| Viewer auth      | None (anonymous)                  | Zero friction — click link, play bingo                       |
| Viewer state     | localStorage                      | No DB pressure from viewers, acceptable durability trade-off |
| Board shuffling  | Seeded PRNG (server-side)         | Deterministic, reproducible, no per-visitor DB storage       |
| Board IDs        | nanoid (12 chars)                 | URL-safe, short, collision-resistant                         |
| Free space       | Admin toggle                      | Flexibility without complexity                               |
| Session storage  | Postgres (`connect-pg-simple`)    | Sessions survive redeploys; no extra infra needed            |
| Square marking   | Canvas drawing (react-konva)      | MS Paint energy — freeform scribbling over the board grid    |
| Drawing storage  | localStorage (serialized strokes) | No server load from viewer drawing state                     |
