import { NextRequest } from 'next/server';
import { loginSchema, formatZodErrors } from '@/validations';
import { userService } from '@/services/userService';
import { generateToken } from '@/lib/jwt';
import { ok, badRequest, unauthorized, serverError } from '@/lib/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest('Validation failed', formatZodErrors(parsed.error));
    }

    const { email, password } = parsed.data;

    const user = await userService.findByEmail(email);
    if (!user) {
      return unauthorized('Invalid email or password');
    }

    // Verify password
    const passwordValid = await userService.verifyPassword(password, user.password);
    if (!passwordValid) {
      return unauthorized('Invalid email or password');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _, ...safeUser } = user;

    return ok('Login successful', { user: safeUser, token });
  } catch (error) {
    console.error('Login error:', error);
    return serverError();
  }
}
