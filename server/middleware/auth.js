/**
 * Middleware to require an authenticated session.
 * Attaches req.user from the session.
 */
export function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = req.session.user;
  next();
}
