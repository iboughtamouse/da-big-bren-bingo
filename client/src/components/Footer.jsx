import { useEffect, useState } from 'react';
import './Footer.css';

function getVisitorCount() {
  const base = 8413;
  const stored = sessionStorage.getItem('bren-bingo-visits');
  return stored ? Number(stored) : base + Math.floor(Math.random() * 200);
}

function Footer() {
  const [count] = useState(() => getVisitorCount());

  useEffect(() => {
    sessionStorage.setItem('bren-bingo-visits', String(count + 1));
  }, [count]);

  const digits = String(count).padStart(6, '0').split('');

  return (
    <footer className="retro-footer">
      <div className="footer-construction">
        🚧 UNDER CONSTRUCTION 🚧
      </div>

      <div className="footer-badges">
        <span className="footer-badge">HTML 3.2 CERTIFIED</span>
        <span className="footer-badge">GIF FRIENDLY</span>
        <span className="footer-badge">BLINK TAG APPROVED</span>
        <span className="footer-badge">NO FRAMES</span>
      </div>

      <div className="footer-counter">
        You are visitor #
        <span className="counter-digits">
          {digits.map((d, i) => (
            <span key={i} className="counter-digit">
              {d}
            </span>
          ))}
        </span>
      </div>

      <div className="footer-best-viewed">
        Best viewed in Netscape Navigator 4.0 at 800×600 resolution
      </div>
    </footer>
  );
}

export default Footer;
