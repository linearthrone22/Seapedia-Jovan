import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { blacklistToken, extractToken, JwtPayload } from '../middlewares/auth.middleware';
import { RoleType } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  roles: z.array(z.enum(['SELLER', 'BUYER', 'DRIVER'])).min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { username, email, password, roles } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) return res.status(409).json({ error: 'Email or username already taken' });

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      username, email, password: hashed,
      roles: { create: roles.map(r => ({ role: r as RoleType })) },
    },
    include: { roles: true },
  });
  res.status(201).json({ message: 'Registered successfully', user: { id: user.id, username: user.username, email: user.email, roles: user.roles.map(r => r.role) } });
};

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email }, include: { roles: true } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const roles = user.roles.map(r => r.role);
  const payload: JwtPayload = { userId: user.id, roles };
  if (roles.length === 1) payload.activeRole = roles[0];

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, roles },
    requiresRoleSelection: roles.length > 1 && !roles.includes('ADMIN'),
  });
};

export const selectRole = async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'Role is required' });
  if (!req.user!.roles.includes(role)) return res.status(403).json({ error: 'You do not have this role' });

  const newToken = jwt.sign({ ...req.user, activeRole: role }, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
  res.json({ token: newToken, activeRole: role });
};

export const logout = async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (token) {
    const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);
    await blacklistToken(token, expiresAt);
  }
  res.json({ message: 'Logged out successfully' });
};

export const me = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { roles: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    id: user.id, username: user.username, email: user.email,
    roles: user.roles.map(r => r.role),
    activeRole: req.user!.activeRole,
  });
};
