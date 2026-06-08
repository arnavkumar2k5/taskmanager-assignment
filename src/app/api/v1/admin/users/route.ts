import { NextRequest } from 'next/server';
import { authenticate, authorize, isErrorResponse } from '@/middleware/auth';
import { userService } from '@/services/userService';
import { ok, serverError } from '@/lib/response';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (isErrorResponse(auth)) return auth;

    const authError = authorize(auth, 'ADMIN');
    if (authError) return authError;

    const users = await userService.findAll();

    return ok('Users retrieved successfully', users);
  } catch (error) {
    console.error('GET /admin/users error:', error);
    return serverError();
  }
}
