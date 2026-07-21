"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isValidHexColor } from "@/lib/theme";

function hexOrError(formData: FormData, field: string): string {
  const value = formData.get(field);
  if (typeof value !== "string" || !isValidHexColor(value)) {
    redirect(`/settings?error=Invalid+color+for+${field}`);
  }
  return value as string;
}

export async function saveSettings(formData: FormData): Promise<void> {
  const user = await requireUser();

  const background = hexOrError(formData, "themeBackground");
  const accent = hexOrError(formData, "themeAccent");
  const foreground = hexOrError(formData, "themeForeground");
  const accentForeground = hexOrError(formData, "themeAccentForeground");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      themeBackground: background,
      themeAccent: accent,
      themeForeground: foreground,
      themeAccentForeground: accentForeground,
    },
  });

  redirect("/settings?saved=1");
}

export async function resetSettings(): Promise<void> {
  const user = await requireUser();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      themeBackground: null,
      themeAccent: null,
      themeForeground: null,
      themeAccentForeground: null,
    },
  });

  redirect("/settings?saved=1");
}
