import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/db';
import { signToken } from '../utils/jwt';
import { ApiError } from '../middleware/errorHandler';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome muito curto.'),
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres.'),
  role: z.enum(['BUYER', 'PHOTOGRAPHER']).default('BUYER'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function publicUser(user: { id: string; name: string; email: string; role: string; avatarUrl: string | null; bio: string | null }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio };
}

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ApiError(409, 'Já existe uma conta com este e-mail.');

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash, role: data.role },
  });

  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({ token, user: publicUser(user) });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new ApiError(401, 'E-mail ou senha inválidos.');

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'E-mail ou senha inválidos.');

  const token = signToken({ userId: user.id, role: user.role });
  res.json({ token, user: publicUser(user) });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) throw new ApiError(404, 'Usuário não encontrado.');
  res.json({ user: publicUser(user) });
}
