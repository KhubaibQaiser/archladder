import Link from 'next/link';

export function Pagination({ page, size, total, query }: { page: number; size: number; total: number; query: string }) {
  const last = Math.max(1, Math.ceil(total / size));
  const href = (p: number) => `?${query}&page=${p}&size=${size}`;
  return (
    <nav aria-label="Pages">
      {page > 1 && <Link href={href(page - 1)}>Previous</Link>}
      <span> Page {page} of {last} </span>
      {page < last && <Link href={href(page + 1)}>Next</Link>}
    </nav>
  );
}
