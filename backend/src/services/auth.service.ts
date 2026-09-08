import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role, User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

export interface RegisterDTO {
  email?: string;
  password?: string;
  name?: string;
  role?: Role;
}

export interface LoginDTO {
  email?: string;
  password?: string;
}

export type SafeUser = Omit<User, 'password'>;

export interface AuthResult {
  user: SafeUser;
  token: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthService {
  public static async register(data: RegisterDTO): Promise<AuthResult> {
    const { email, password, name, role } = data;

    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new AppError('Email is required', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw new AppError('Invalid email format', 400);
    }

    if (!password || typeof password !== 'string') {
      throw new AppError('Password is required', 400);
    }

    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400);
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new AppError('Name is required', 400);
    }

    const allowedRegisterRoles: Role[] = [Role.TEAM_MEMBER, Role.FACULTY];

    let userRole: Role = Role.TEAM_MEMBER;
    if (role !== undefined) {
      if (!allowedRegisterRoles.includes(role)) {
        throw new AppError(`Invalid role. Allowed roles: ${allowedRegisterRoles.join(', ')}`, 400);
      }
      userRole = role;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name.trim(),
        role: userRole,
      },
    });

    const token = this.generateToken(user);
    const { password: _, ...safeUser } = user;

    return {
      user: safeUser,
      token,
    };
  }

  public static async login(data: LoginDTO): Promise<AuthResult> {
    const { email, password } = data;

    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new AppError('Email is required', 400);
    }

    if (!password || typeof password !== 'string') {
      throw new AppError('Password is required', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = this.generateToken(user);
    const { password: _, ...safeUser } = user;

    return {
      user: safeUser,
      token,
    };
  }

  private static generateToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }
}
