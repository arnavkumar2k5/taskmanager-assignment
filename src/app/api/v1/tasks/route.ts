import { NextRequest } from 'next/server';
import { authenticate, isErrorResponse } from '@/middleware/auth';
import { taskService } from '@/services/taskService';
import { createTaskSchema, paginationSchema, formatZodErrors } from '@/validations';
import { ok, created, badRequest, serverError } from '@/lib/response';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (isErrorResponse(auth)) return auth;

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

    const { tasks, total } = await taskService.findByUser(auth.userId, {
      page,
      limit,
      search,
    });

    const totalPages = Math.ceil(total / limit);

    return ok('Tasks retrieved successfully', tasks, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error('GET /tasks error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (isErrorResponse(auth)) return auth;

    const body = await request.json().catch(() => ({}));
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest('Validation failed', formatZodErrors(parsed.error));
    }

    const task = await taskService.create(auth.userId, parsed.data);

    return created('Task created successfully', task);
  } catch (error) {
    console.error('POST /tasks error:', error);
    return serverError();
  }
}
