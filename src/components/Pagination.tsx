"use client";

import { useRouter } from "next/navigation";

export function Pagination({
  basePath,
  q,
  sort,
  page,
  totalPages,
}: {
  basePath: string;
  q: string;
  sort: string;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();

  function go(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sort !== "title") params.set("sort", sort);
    if (targetPage !== 1) params.set("page", String(targetPage));
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button type="button" className="win-button small" disabled={page <= 1} onClick={() => go(page - 1)}>
        ← Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button type="button" className="win-button small" disabled={page >= totalPages} onClick={() => go(page + 1)}>
        Next →
      </button>
    </div>
  );
}
