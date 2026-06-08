import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { User, SafeUser } from '@/types';

const SALT_ROUNDS = 12;

export const userService = {
  async findByEmail(email: string): Promise<User | null> {
    const result = await query<User>(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    return result.rows[0] ?? null;
  },

  async findById(id: string): Promise<SafeUser | null> {
    const result = await query<SafeUser>(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows[0] ?? null;
  },

  async create(name: string, email: string, password: string): Promise<SafeUser> {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await query<SafeUser>(
      `INSERT INTO users (id, name, email, password, role, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 'USER', NOW())
       RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword]
    );

    return result.rows[0];
  },

  async verifyPassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  },

  async findAll(): Promise<SafeUser[]> {
    const result = await query<SafeUser>(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  },
};
