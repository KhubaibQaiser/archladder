import { listBooks } from '@/lib/books';
import { PageSizeSelect } from '@/components/page-size-select';
import { Pagination } from '@/components/pagination';

export default async function BooksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const { rows, total, page, size } = await listBooks(params);
  const from = (page - 1) * size + 1;
  const query = new URLSearchParams({ q: params.q ?? '', ...(params.branch ? { branch: params.branch } : {}) }).toString();
  return (
    <main>
      <h1>Books</h1>
      <p>Showing {from}-{from + rows.length - 1} of {total.toLocaleString()}</p>
      <PageSizeSelect size={size} />
      <ul>
        {rows.map((b) => (
          <li key={b.id}>{b.title} by {b.author} ({b.format}){b.available ? '' : ', on loan'}</li>
        ))}
      </ul>
      <Pagination page={page} size={size} total={total} query={query} />
    </main>
  );
}
