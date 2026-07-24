"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * A native <form method="GET"> triggers a full browser navigation, which
 * unmounts the root layout - and with it the persistent <audio> element -
 * killing playback. Using the Next.js router instead keeps navigation
 * client-side, same as clicking a <Link>, so music keeps playing.
 */
export function SearchForm({
  action,
  placeholder,
  defaultValue,
}: {
  action: string;
  placeholder: string;
  defaultValue: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `${action}?q=${encodeURIComponent(trimmed)}` : action);
  }

  return (
    <form onSubmit={handleSubmit} className="win-panel win-raised">
      <label htmlFor="q">Search</label>
      <input
        id="q"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
      <button type="submit" className="win-button small">
        Search
      </button>
    </form>
  );
}
