import { useEffect } from 'react';

export default function About() {
  useEffect(() => {
    document.title = 'About — Da Big Bren Bingo';
  }, []);

  return (
    <div className="about">
      <h1>WTF Is This?</h1>

      <p>
        <strong>Da Big Bren Bingo</strong> is a bingo board app built for live
        streams. Someone creates a board, shares the link, and every viewer gets
        their own unique shuffled version. Mark squares by scribbling on them MS
        Paint–style.
      </p>

      <section className="about-section">
        <h2>🎬 For Creators</h2>
        <ol>
          <li>
            <strong>Log in with Discord.</strong> That's the only auth — we grab
            your username and avatar. That's it.{' '}
            <em>You only need to log in to create boards, not to play on one.</em>
          </li>
          <li>
            <strong>Create a board.</strong> Give it a title and add your bingo
            items — either comma-separated or one per line. Order doesn't matter
            since everyone gets a shuffled board anyway.
          </li>
          <li>
            <strong>Share the link.</strong> Once you save, you're taken to the
            board. Copy the URL from the address bar or grab it from the share
            link below the board.
          </li>
        </ol>
        <p>
          You need at least <strong>24 items</strong> with a free center space,
          or <strong>25 items</strong> without one. You can add up to{' '}
          <strong>500 items</strong>. If you add more items than there are board
          slots, each viewer gets a random subset picked from the pool. More
          items means more variety across viewers' boards.
        </p>
        <p>
          You can make as many boards as you want. You can also edit or delete
          them later from the edit page.
        </p>
      </section>

      <section className="about-section">
        <h2>🎮 For Players</h2>
        <ul>
          <li>Someone sends you a link to a board — click it</li>
          <li>You get your own unique shuffled board</li>
          <li>Draw on squares to mark them off (pen tool, colors, sizes — go wild)</li>
          <li>Screenshot if you get a bingo and share it!</li>
        </ul>
      </section>

      <section className="about-section">
        <h2>⚡ Good to Know</h2>
        <ul>
          <li>
            Everyone gets their own board — marking stuff on yours won't affect
            anyone else's.
          </li>
          <li>
            If there are more items than board spaces, items are randomly
            selected <em>and</em> shuffled. More items = more variety across
            viewers.
          </li>
          <li>
            Marking is done à la MS Paint — freehand drawing on a canvas overlay.
            Pen, eraser, colors, stroke sizes.
          </li>
          <li>
            <strong>Nothing is saved server-side</strong> — your drawings stay on
            this device in local storage for that board, but they are not shared
            with anyone else and won't follow you to another browser or device.
          </li>
        </ul>
      </section>

      <section className="about-section">
        <h2>🛠️ Nerd Stuff</h2>
        <p>
          Built with React + Express + Postgres. Shuffling is deterministic — same
          visitor always gets the same board layout (seeded PRNG). Deployed on
          Vercel + Railway. Source code is public on{' '}
          <a
            href="https://github.com/iboughtamouse/da-big-bren-bingo"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>
      </section>
    </div>
  );
}
