import { NextRequest } from 'next/server';
import { authenticate, isErrorResponse } from '@/middleware/auth';
import { taskService } from '@/services/taskService';
import { updateTaskSchema, formatZodErrors } from '@/validations';
import { ok, badRequest, forbidden, notFound, serverError } from '@/lib/response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticate(request);
    if (isErrorResponse(auth)) return auth;

    const { id } = await params;

    const task = await taskService.findById(id);
    if (!task) return notFound('Task not found');

    if (task.user_id !== auth.userId) {
      return forbidden('You can only edit your own tasks');
    }

    const body = await request.json().catch(() => ({}));
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest('Validation failed', formatZodErrors(parsed.error));
    }

    if (Object.keys(parsed.data).length === 0) {
      return badRequest('No fields to update');
    }

    const updated = await taskService.update(id, parsed.data);
    if (!updated) return notFound('Task not found');

    return ok('Task updated successfully', updated);
  } catch (error) {
    console.error('PUT /tasks/:id error:', error);
    return serverError();
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticate(request);
    if (isErrorResponse(auth)) return auth;

    const { id } = await params;

    const task = await taskService.findById(id);
    if (!task) return notFound('Task not found');

    if (auth.role !== 'ADMIN' && task.user_id !== auth.userId) {
      return forbidden('You can only delete your own tasks');
    }

    await taskService.delete(id);

    return ok('Task deleted successfully');
  } catch (error) {
    console.error('DELETE /tasks/:id error:', error);
    return serverError();
  }
}
