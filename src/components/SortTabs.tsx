"use client";

import { useRouter } from "next/navigation";

const OPTIONS: { value: string; label: string }[] = [
  { value: "title", label: "A–Z" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

export function SortTabs({ basePath, q, current }: { basePath: string; q: string; current: string }) {
  const router = useRouter();

  function handleSelect(value: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (value !== "title") params.set("sort", value);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <div className="sort-tabs">
      <span>Sort:</span>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`win-button small${current === opt.value ? " special" : ""}`}
          onClick={() => handleSelect(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
