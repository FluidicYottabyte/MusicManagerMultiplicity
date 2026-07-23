// This page always reflects live, per-user session and DB state - never statically pre-render it.
export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { paletteForUser } from "@/lib/theme";

import { changePassword, resetSettings, saveSettings } from "./actions";

export default async function SettingsPage({ searchParams }: { searchParams: { error?: string; saved?: string } }) {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
  const palette = paletteForUser(user);

  return (
    <div>
      <h1>Settings</h1>
      {searchParams.error && <div className="error-message">{searchParams.error.replace(/\+/g, " ")}</div>}
      {searchParams.saved && <div className="info-message">Saved.</div>}

      <form action={saveSettings} className="win-panel win-raised">
        <h3>Theme Colors</h3>
        <div className="theme-swatch-row">
          <label>
            Background
            <input type="color" name="themeBackground" defaultValue={palette.background} />
          </label>
          <label>
            Accent
            <input type="color" name="themeAccent" defaultValue={palette.accent} />
          </label>
          <label>
            Foreground
            <input type="color" name="themeForeground" defaultValue={palette.foreground} />
          </label>
          <label>
            Accent Foreground
            <input type="color" name="themeAccentForeground" defaultValue={palette.accentForeground} />
          </label>
        </div>
        <button type="submit" className="win-button">
          Save
        </button>
        <button type="submit" formAction={resetSettings} className="win-button">
          Reset to Defaults
        </button>
      </form>

      <form action={changePassword} className="win-panel win-raised">
        <h3>Change Password</h3>
        <label htmlFor="currentPassword">Current password</label>
        <input id="currentPassword" type="password" name="currentPassword" autoComplete="current-password" required />

        <label htmlFor="newPassword">New password (min 8 characters)</label>
        <input id="newPassword" type="password" name="newPassword" autoComplete="new-password" minLength={8} required />

        <label htmlFor="confirmPassword">Confirm new password</label>
        <input id="confirmPassword" type="password" name="confirmPassword" autoComplete="new-password" minLength={8} required />

        <button type="submit" className="win-button">
          Change Password
        </button>
      </form>
    </div>
  );
}
