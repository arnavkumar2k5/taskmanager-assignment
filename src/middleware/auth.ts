import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractBearerToken } from '@/lib/jwt';
import { unauthorized, forbidden } from '@/lib/response';
import { AuthContext, UserRole } from '@/types';

export async function authenticate(
  request: NextRequest
): Promise<AuthContext | NextResponse> {
  const authHeader = request.headers.get('authorization');
  const token = extractBearerToken(authHeader);

  if (!token) {
    return unauthorized('No authentication token provided');
  }

  try {
    const payload = verifyToken(token);
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return unauthorized('Invalid or expired token');
  }
}

export function authorize(
  auth: AuthContext,
  requiredRole: UserRole
): NextResponse | void {
  if (auth.role !== requiredRole) {
    return forbidden(`Access denied. Required role: ${requiredRole}`);
  }
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
