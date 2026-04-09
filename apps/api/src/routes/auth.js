import { Router } from 'express';
import { signToken } from '../middleware/auth.js';

const router = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Response: { token, user: { username } }
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken({ username });
  res.json({ token, user: { username } });
});

export default router;
