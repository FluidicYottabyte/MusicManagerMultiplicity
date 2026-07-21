"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function createUser(formData: FormData): Promise<void> {
  await requireAdmin();

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const isAdmin = formData.get("isAdmin") === "on";

  if (!username) redirect("/admin/users/new?error=Username+is+required");
  if (password.length < 8) redirect("/admin/users/new?error=Password+must+be+at+least+8+characters");

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) redirect("/admin/users/new?error=That+username+is+already+taken");

  const passwordHash = await hash(password, 12);
  await prisma.user.create({ data: { username, passwordHash, isAdmin } });

  redirect("/admin/users");
}

export async function deleteUser(userId: string): Promise<void> {
  const admin = await requireAdmin();
  if (userId === admin.id) {
    redirect("/admin/users?error=You+cannot+delete+your+own+account");
  }
  await prisma.user.delete({ where: { id: userId } });
  redirect("/admin/users");
}
