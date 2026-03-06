# Da Big Bren Bingo — Client

React SPA for the bingo board viewer and admin interface. Built with Vite, deployed to Vercel.

## Stack

- **React 19** + **React Router 7** — SPA routing
- **react-konva** / **Konva** — Canvas drawing overlay for marking squares
- **uuid** — Visitor ID generation for deterministic board shuffles
- **Vite 7** — Dev server + build tooling

## Pages

| Route             | Component     | Purpose                                |
| ----------------- | ------------- | -------------------------------------- |
| `/`               | Home          | Landing page with "Create a Board" CTA |
| `/create`         | BoardEditor   | Create a new board (auth required)     |
| `/board/:id/edit` | BoardEditor   | Edit existing board (owner only)       |
| `/board/:id`      | BoardPlay     | Viewer experience — shuffled board + drawing |

## Key Components

- **BingoGrid** — 5×5 grid with cell selection, free space, 3-line clamp with hover tooltips
- **DrawingCanvas** — Konva canvas overlay with pen/eraser tools, color picker, stroke sizes
- **Header** — Discord login/logout, "My Boards" dropdown, navigation
- **Footer** — Retro Angelfire-style footer

## Development

```bash
# From the project root:
npm run dev:client

# Or from this directory:
npm run dev
```

Vite dev server runs on `http://localhost:5173` and proxies `/api/*` to the Express backend at `http://localhost:3000`.

## Production

Deployed to Vercel. The `vercel.json` config handles:
- `/api/*` — Proxied to Railway backend (same-origin for cookies)
- `/*` — SPA fallback to `index.html`

## Environment Variables

| Variable        | Required | Description                                    |
| --------------- | -------- | ---------------------------------------------- |
| `VITE_API_URL`  | No       | API base URL override (empty = same origin, which is correct for Vercel proxy) |
