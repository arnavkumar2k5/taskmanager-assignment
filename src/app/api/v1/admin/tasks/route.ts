import { NextRequest } from 'next/server';
import { authenticate, authorize, isErrorResponse } from '@/middleware/auth';
import { taskService } from '@/services/taskService';
import { paginationSchema, formatZodErrors } from '@/validations';
import { ok, badRequest, serverError } from '@/lib/response';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (isErrorResponse(auth)) return auth;

    const authError = authorize(auth, 'ADMIN');
    if (authError) return authError;

    const { searchParams } = request.nextUrl;
    const parsed = paginationSchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
    });

    if (!parsed.success) {
      return badRequest('Invalid query parameters', formatZodErrors(parsed.error));
    }

    const { page, limit, search } = parsed.data;
    const { tasks, total } = await taskService.findAll({ page, limit, search });
    const totalPages = Math.ceil(total / limit);

    return ok('All tasks retrieved successfully', tasks, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error('GET /admin/tasks error:', error);
    return serverError();
  }
}
