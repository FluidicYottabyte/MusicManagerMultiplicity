"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveResizedImage } from "@/lib/images";
import { StoragePaths } from "@/lib/storage";
import { isUploadableFile } from "@/lib/uploadSong";

export async function setArtistPhoto(artistId: string, formData: FormData): Promise<void> {
  await requireUser();

  const file = formData.get("photo");
  if (!isUploadableFile(file)) {
    redirect(`/artists/${artistId}?error=Please+choose+an+image`);
  }

  let filename: string;
  try {
    filename = await saveResizedImage(file, StoragePaths.artistPhotoDir);
  } catch {
    redirect(`/artists/${artistId}?error=Unsupported+image+type`);
  }

  await prisma.artist.update({ where: { id: artistId }, data: { photoPath: filename } });

  redirect(`/artists/${artistId}`);
}
