import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { requireUser } from "@/lib/auth";
import { ensureStorageDirectories } from "@/lib/storage";
import { isUploadableFile, uploadSongFile } from "@/lib/uploadSong";

export const runtime = "nodejs";

function nonEmpty(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Handles exactly one file per request - the client uploads a multi-file selection sequentially so it can show per-file progress. */
export async function POST(req: NextRequest) {
  const user = await requireUser();

  const formData = await req.formData();
  const file = formData.get("file");
  if (!isUploadableFile(file)) {
    return NextResponse.json({ ok: false, reason: "No file provided" }, { status: 400 });
  }

  await ensureStorageDirectories();

  const overrides = {
    title: nonEmpty(formData.get("title")),
    artistNames: nonEmpty(formData.get("artistNames")),
    albumName: nonEmpty(formData.get("albumName")),
  };

  const result = await uploadSongFile(file, overrides, user.id);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
