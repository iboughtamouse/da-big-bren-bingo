# Da Big Bren Bingo — Server

Express 5 API server handling board CRUD, Discord OAuth, and deterministic board shuffling. Deployed to Railway.

## Stack

- **Express 5** — API framework
- **PostgreSQL** (via `pg`) — Boards, items, users, sessions
- **connect-pg-simple** — Session storage in Postgres
- **nanoid** — URL-safe board IDs
- **seedrandom** — Deterministic board shuffling

## API Routes

### Auth

| Method | Path                         | Auth     | Description                    |
| ------ | ---------------------------- | -------- | ------------------------------ |
| GET    | `/api/auth/discord`          | —        | Redirect to Discord OAuth      |
| GET    | `/api/auth/discord/callback` | —        | Handle OAuth callback          |
| GET    | `/api/auth/me`               | Session  | Return current user (or 401)   |
| POST   | `/api/auth/logout`           | Session  | Destroy session                |

### Boards

| Method | Path                          | Auth    | Description                       |
| ------ | ----------------------------- | ------- | --------------------------------- |
| GET    | `/api/boards`                 | Session | List boards for current user      |
| POST   | `/api/boards`                 | Session | Create a new board                |
| GET    | `/api/boards/:id`             | —       | Board metadata (items if owner)   |
| PUT    | `/api/boards/:id`             | Owner   | Update board                      |
| DELETE | `/api/boards/:id`             | Owner   | Delete board                      |
| GET    | `/api/boards/:id/play?visitor=` | —     | Shuffled 5×5 grid for a visitor   |

### Health

| Method | Path          | Description          |
| ------ | ------------- | -------------------- |
| GET    | `/api/health` | DB connectivity check |

## Development

```bash
# From the project root:
npm run dev:server

# Or from this directory:
npm run dev    # uses --watch for auto-reload
```

Server runs on `http://localhost:3000`. Requires a `.env` file in the project root (see `.env.example`).

## Environment Variables

| Variable                | Required | Description                              |
| ----------------------- | -------- | ---------------------------------------- |
| `DATABASE_URL`          | Yes      | Postgres connection string               |
| `DISCORD_CLIENT_ID`     | Yes      | Discord OAuth app client ID              |
| `DISCORD_CLIENT_SECRET` | Yes      | Discord OAuth app client secret          |
| `DISCORD_REDIRECT_URI`  | Yes      | OAuth callback URL                       |
| `SESSION_SECRET`        | Yes      | Secret for signing session cookies       |
| `CLIENT_URL`            | Yes      | Frontend URL (CORS origin + redirects)   |
| `PORT`                  | No       | Server port (default: 3000)              |
| `NODE_ENV`              | No       | Set to `production` for secure cookies   |

## Database

Schema auto-initializes on startup via `db/schema.sql`. Tables:

- **session** — Express sessions (connect-pg-simple)
- **users** — Discord-authenticated admins
- **boards** — Bingo boards with title, free space toggle, and optional free-space text
- **board_items** — Item pool per board with sort order
