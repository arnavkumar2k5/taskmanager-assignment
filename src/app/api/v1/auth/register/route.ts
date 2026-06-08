import { NextRequest } from 'next/server';
import { registerSchema, formatZodErrors } from '@/validations';
import { userService } from '@/services/userService';
import { generateToken } from '@/lib/jwt';
import { created, badRequest, serverError } from '@/lib/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest('Validation failed', formatZodErrors(parsed.error));
    }

    const { name, email, password } = parsed.data;

    const existing = await userService.findByEmail(email);
    if (existing) {
      return badRequest('Validation failed', {
        email: ['An account with this email already exists'],
      });
    }

    const user = await userService.create(name, email, password);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return created('Account created successfully', { user, token });
  } catch (error) {
    console.error('Register error:', error);
    return serverError();
  }
}
