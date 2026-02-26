import { Request, Response } from 'express';
import prisma from '../prisma/index.js';

// Simple password hashing (for demo purposes - in production use bcrypt)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// In-memory session storage (for production, use proper session/JWT)
const sessions = new Map<string, { username: string; expiresAt: Date }>();

export const adminController = {
  // Admin login
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      // For demo, use hardcoded admin credentials
      // In production, fetch from database with proper hashing
      const ADMIN_USERNAME = 'admin';
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

      if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Create session
      const sessionId = simpleHash(Date.now().toString());
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      sessions.set(sessionId, { username, expiresAt });

      res.json({
        message: 'Login successful',
        sessionId,
        username,
        expiresAt: expiresAt.toISOString()
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  },

  // Admin logout
  async logout(req: Request, res: Response) {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');

      if (sessionId) {
        sessions.delete(sessionId);
      }

      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Error during logout:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  },

  // Verify session
  async verify(req: Request, res: Response) {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');

      if (!sessionId) {
        return res.status(401).json({ authenticated: false });
      }

      const session = sessions.get(sessionId);

      if (!session) {
        return res.status(401).json({ authenticated: false });
      }

      if (session.expiresAt < new Date()) {
        sessions.delete(sessionId);
        return res.status(401).json({ authenticated: false });
      }

      res.json({
        authenticated: true,
        username: session.username
      });
    } catch (error) {
      console.error('Error verifying session:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  },

  // Get statistics
  async getStats(req: Request, res: Response) {
    try {
      const [totalSentences, byCategory, byDifficulty, audioStatus] = await Promise.all([
        prisma.sentence.count({ where: { isDeleted: false } }),
        prisma.sentence.groupBy({
          by: ['category'],
          where: { isDeleted: false },
          _count: true
        }),
        prisma.sentence.groupBy({
          by: ['difficulty'],
          where: { isDeleted: false },
          _count: true
        }),
        prisma.sentence.groupBy({
          by: ['audioStatus'],
          where: { isDeleted: false },
          _count: true
        })
      ]);

      res.json({
        totalSentences,
        byCategory: byCategory.map(c => ({ category: c.category, count: c._count })),
        byDifficulty: byDifficulty.map(d => ({ difficulty: d.difficulty, count: d._count })),
        audioStatus: audioStatus.map(s => ({ status: s.audioStatus, count: s._count }))
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
};

export default adminController;
