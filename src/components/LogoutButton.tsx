"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button type="button" className="win-button small" onClick={() => signOut({ callbackUrl: "/login" })}>
      Log out
    </button>
  );
}
