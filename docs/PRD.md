# Product Requirements Document — Da Big Bren Bingo

## Overview

A web application for creating and sharing bingo boards, designed for live stream use. An admin (streamer) creates a bingo board with a pool of items. Viewers visit a share link and each receive their own unique version of the board — same pool, different arrangement. Viewers mark squares as events happen on stream.

## Users

### Admin (Board Creator)

- Authenticates via Discord OAuth
- Creates bingo boards by providing a title and a pool of items
- Can edit their boards after creation
- Shares a public link with their audience

### Viewer (Board Player)

- No authentication required — fully anonymous
- Clicks a share link and receives a unique shuffled board
- Marks squares during the stream
- Gets the same board on revisit (deterministic per-visitor shuffle)

## Core Features (MVP)

### Board Creation

- Admin logs in with Discord
- Admin enters a board title
- Admin provides a pool of bingo items (newline-separated or comma-separated — we parse both)
- Admin toggles whether the board has a free center space
- **Minimum pool size:** 24 items (with free space) or 25 items (without free space) for a 5×5 grid
- Board is saved and admin receives a shareable link

### Board Editing

- Admin can return to their board and modify the title, item pool, or free space toggle
- Only the board's creator (identified by Discord account) can edit

### Board Viewing (Visitor Experience)

- Visitor opens the share link — no login, no friction
- A unique visitor ID is generated and stored in localStorage
- If the pool has more items than board slots (24 or 25), a random subset is selected for this visitor
- If the pool equals exactly the number of slots, all items are used
- The selected items are shuffled into a 5×5 grid, unique to this visitor
- The shuffle and selection are **deterministic** — same visitor ID always produces the same board
- If a free space is enabled, the center square is always "FREE"

### Square Marking — The MS Paint Experience

The original inspiration: Bren currently screenshots a bingo board into MS Paint and scribbles over squares with random colors and brushes. The marking system should capture that chaotic, whimsical energy — not replace it.

- A transparent HTML5 canvas is overlaid on the bingo grid
- Viewer gets a mini-toolbar with drawing tools:
  - **Brushes:** different sizes (thin, medium, thicc)
  - **Colors:** a palette of fun colors to pick from
  - **Highlighter:** semi-transparent strokes for that highlighter-over-text feel
  - **Eraser:** undo mistakes
- Viewer draws freely over the board — scribble circles, cross things out, doodle, whatever
- Drawing state (stroke data) is serialized and saved to localStorage per board per visitor
- Restored on revisit so their masterpiece persists
- Library: **react-konva** (Konva.js with React bindings) — good balance of power and simplicity for freeform drawing

## Out of Scope (for now)

- Win detection / validation
- Real-time notifications ("someone got bingo!")
- Viewer identity / Discord login for viewers
- Leaderboard or scoring
- Multiple board management dashboard
- Board templates or themes
- Board expiration or archival
- Mobile drawing optimization (functional but not a priority)

## Constraints

- Must handle burst traffic (50–500 concurrent viewers when a streamer drops the link in chat)
- Must be stream-safe — no secrets visible in URL bar or on screen during board creation/management
- Must work on mobile browsers (significant portion of Twitch/stream audiences)
