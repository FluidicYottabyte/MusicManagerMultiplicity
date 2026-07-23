"use server";

import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureStorageDirectories, StoragePaths } from "@/lib/storage";
import { isUploadableFile } from "@/lib/uploadSong";

const ALLOWED_IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif"]);

export async function setArtistPhoto(artistId: string, formData: FormData): Promise<void> {
  await requireUser();

  const file = formData.get("photo");
  if (!isUploadableFile(file)) {
    redirect(`/artists/${artistId}?error=Please+choose+an+image`);
  }

  const ext = path.extname(file.name).slice(1).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    redirect(`/artists/${artistId}?error=Unsupported+image+type`);
  }

  await ensureStorageDirectories();
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(StoragePaths.artistPhotoDir, filename), Buffer.from(await file.arrayBuffer()));

  await prisma.artist.update({ where: { id: artistId }, data: { photoPath: filename } });

  redirect(`/artists/${artistId}`);
}
