import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { config } from '../src/config';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Authentication API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully with default role', async () => {
      const mockCreatedUser = {
        id: 'user-uuid-1',
        email: 'john@example.com',
        name: 'John Doe',
        password: '$2a$10$hashedpasswordstringplaceholder',
        role: 'TEAM_MEMBER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockResolvedValue(mockCreatedUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'john@example.com',
          password: 'Password123!',
          name: 'John Doe',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');

      const user = response.body.data.user;
      expect(user.id).toBe('user-uuid-1');
      expect(user.email).toBe('john@example.com');
      expect(user.name).toBe('John Doe');
      expect(user.role).toBe('TEAM_MEMBER');
      expect(user).not.toHaveProperty('password');

      // Verify token
      const decoded = jwt.verify(response.body.data.token, config.jwtSecret) as any;
      expect(decoded.id).toBe('user-uuid-1');
      expect(decoded.email).toBe('john@example.com');
      expect(decoded.role).toBe('TEAM_MEMBER');

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'john@example.com',
          name: 'John Doe',
          role: 'TEAM_MEMBER',
        }),
      });
    });

    it('should register a user with custom role if specified', async () => {
      const mockCreatedUser = {
        id: 'faculty-uuid-1',
        email: 'prof@example.com',
        name: 'Prof Smith',
        password: '$2a$10$hashedpasswordstringplaceholder',
        role: 'FACULTY',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockResolvedValue(mockCreatedUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'prof@example.com',
          password: 'Password123!',
          name: 'Prof Smith',
          role: 'FACULTY',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('FACULTY');
    });

    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'Password123!',
          name: 'John Doe',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email is required');
    });

    it('should return 400 if email format is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email-format',
          password: 'Password123!',
          name: 'John Doe',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email format');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'john@example.com',
          name: 'John Doe',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Password is required');
    });

    it('should return 400 if password is shorter than 6 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'john@example.com',
          password: '12345',
          name: 'John Doe',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Password must be at least 6 characters long');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'john@example.com',
          password: 'Password123!',
          name: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Name is required');
    });

    it('should return 400 if role is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'john@example.com',
          password: 'Password123!',
          name: 'John Doe',
          role: 'SUPERADMIN',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid role');
    });

    it('should return 409 if user email already exists', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'existing-id',
        email: 'john@example.com',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'john@example.com',
          password: 'Password123!',
          name: 'John Doe',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const rawPassword = 'Password123!';
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const mockUser = {
        id: 'user-uuid-1',
        email: 'john@example.com',
        name: 'John Doe',
        password: hashedPassword,
        role: 'TEAM_MEMBER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: rawPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');

      const user = response.body.data.user;
      expect(user.id).toBe('user-uuid-1');
      expect(user.email).toBe('john@example.com');
      expect(user).not.toHaveProperty('password');

      const decoded = jwt.verify(response.body.data.token, config.jwtSecret) as any;
      expect(decoded.id).toBe('user-uuid-1');
      expect(decoded.email).toBe('john@example.com');
    });

    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Password123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email is required');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Password is required');
    });

    it('should return 401 if user does not exist', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 401 if password does not match', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 10);

      const mockUser = {
        id: 'user-uuid-1',
        email: 'john@example.com',
        name: 'John Doe',
        password: hashedPassword,
        role: 'TEAM_MEMBER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'WrongPassword!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });
  });
});
