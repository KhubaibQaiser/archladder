import 'server-only';
import { Pool } from 'pg';
import { z } from 'zod';

const pool = new Pool();

export const PAGE_SIZES = [20, 50, 100] as const;

const QuerySchema = z.object({
  q: z.string().max(200).default(''),
  branch: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().refine((n) => PAGE_SIZES.includes(n as 20 | 50 | 100)).default(50),
});

export async function listBooks(params: Record<string, string | undefined>) {
  const { q, branch, page, size } = QuerySchema.parse(params);
  const offset = (page - 1) * size;
  const where = `($1 = '' or title % $1 or author % $1) and ($2::text is null or branch_id = $2)`;
  const [rows, count] = await Promise.all([
    pool.query(`select id, title, author, format, available from books where ${where}
                order by title, id limit $3 offset $4`, [q, branch ?? null, size, offset]),
    pool.query(`select count(*)::int as total from books where ${where}`, [q, branch ?? null]),
  ]);
  return { rows: rows.rows, total: count.rows[0].total as number, page, size };
}
