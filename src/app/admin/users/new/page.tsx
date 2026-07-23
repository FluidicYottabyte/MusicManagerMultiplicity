// This page always reflects live, per-user session and DB state - never statically pre-render it.
export const dynamic = "force-dynamic";

import { createUser } from "../actions";

export default function NewUserPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div>
      <h1>New User</h1>
      {searchParams.error && <div className="error-message">{searchParams.error.replace(/\+/g, " ")}</div>}
      <form action={createUser} className="win-panel win-raised">
        <label htmlFor="username">Username</label>
        <input id="username" type="text" name="username" required />

        <label htmlFor="password">Password (min 8 characters)</label>
        <input id="password" type="password" name="password" minLength={8} required />

        <label htmlFor="isAdmin">
          <input id="isAdmin" type="checkbox" name="isAdmin" style={{ width: "auto", marginRight: 6 }} />
          Grant admin privileges
        </label>

        <button type="submit" className="win-button">
          Create
        </button>
      </form>
    </div>
  );
}
