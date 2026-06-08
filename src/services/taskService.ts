import { query } from '@/lib/db';
import { Task, TaskWithUser, PaginationParams } from '@/types';
import { CreateTaskInput, UpdateTaskInput } from '@/validations';

export const taskService = {
  async findByUser(
    userId: string,
    { page, limit, search }: PaginationParams
  ): Promise<{ tasks: Task[]; total: number }> {
    const offset = (page - 1) * limit;

    const selectSearchCondition = search
      ? `AND (title ILIKE $4 OR description ILIKE $4)`
      : '';
    const countSearchCondition = search
      ? `AND (title ILIKE $2 OR description ILIKE $2)`
      : '';
    const searchParam = search ? [`%${search}%`] : [];

    const [tasksResult, countResult] = await Promise.all([
      query<Task>(
        `SELECT * FROM tasks
         WHERE user_id = $1 ${selectSearchCondition}
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset, ...searchParam]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM tasks WHERE user_id = $1 ${countSearchCondition}`,
        [userId, ...searchParam]
      ),
    ]);

    return {
      tasks: tasksResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  },

  async findById(id: string): Promise<Task | null> {
    const result = await query<Task>(
      'SELECT * FROM tasks WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows[0] ?? null;
  },

  async create(userId: string, input: CreateTaskInput): Promise<Task> {
    const result = await query<Task>(
      `INSERT INTO tasks (id, title, description, status, user_id, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
       RETURNING *`,
      [input.title, input.description, input.status, userId]
    );
    return result.rows[0];
  },

  async update(id: string, input: UpdateTaskInput): Promise<Task | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(input.title);
    }
    if (input.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(input.description);
    }
    if (input.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(input.status);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query<Task>(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM tasks WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async findAll(
    { page, limit, search }: PaginationParams
  ): Promise<{ tasks: TaskWithUser[]; total: number }> {
    const offset = (page - 1) * limit;
    const searchCondition = search
      ? `WHERE (t.title ILIKE $3 OR t.description ILIKE $3 OR u.name ILIKE $3)`
      : '';
    const searchParam = search ? [`%${search}%`] : [];

    const [tasksResult, countResult] = await Promise.all([
      query<TaskWithUser>(
        `SELECT t.*, u.name as user_name, u.email as user_email
         FROM tasks t
         JOIN users u ON t.user_id = u.id
         ${searchCondition}
         ORDER BY t.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset, ...searchParam]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM tasks t
         JOIN users u ON t.user_id = u.id
         ${searchCondition}`,
        searchParam
      ),
    ]);

    return {
      tasks: tasksResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  },
};
