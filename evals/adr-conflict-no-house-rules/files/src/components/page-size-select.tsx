'use client';
import { useRouter, useSearchParams } from 'next/navigation';

const SIZES = [20, 50, 100];

export function PageSizeSelect({ size }: { size: number }) {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <label>
      Per page{' '}
      <select
        value={size}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          next.set('size', e.target.value);
          next.set('page', '1');
          router.push(`?${next.toString()}`);
        }}
      >
        {SIZES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </label>
  );
}
