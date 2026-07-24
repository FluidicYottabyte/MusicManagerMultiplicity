"use server";

import { compare, hash } from "bcryptjs";
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

export async function changePassword(formData: FormData): Promise<void> {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const currentValid = await compare(currentPassword, user.passwordHash);
  if (!currentValid) {
    redirect("/settings?error=Current+password+is+incorrect");
  }
  if (newPassword.length < 8) {
    redirect("/settings?error=New+password+must+be+at+least+8+characters");
  }
  if (newPassword !== confirmPassword) {
    redirect("/settings?error=New+passwords+did+not+match");
  }

  const passwordHash = await hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  redirect("/settings?saved=1");
}

export async function changeUsername(formData: FormData): Promise<void> {
  const user = await requireUser();

  const newUsername = String(formData.get("newUsername") ?? "").trim();
  if (!newUsername) {
    redirect("/settings?error=Username+cannot+be+empty");
  }

  const existing = await prisma.user.findUnique({ where: { username: newUsername } });
  if (existing && existing.id !== user.id) {
    redirect("/settings?error=That+username+is+already+taken");
  }

  await prisma.user.update({ where: { id: user.id }, data: { username: newUsername } });

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
