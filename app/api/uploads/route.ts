import { NextRequest, NextResponse } from "next/server";
import { buildStorageKey, uploadBuffer } from "@/lib/storage";
import { requireAppSession } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  const { error } = await requireAppSession();
  if (error) {
    return error;
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const prefix = String(formData.get("prefix") ?? "uploads");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const upload = await uploadBuffer({
    key: buildStorageKey(prefix, file.name),
    body: Buffer.from(arrayBuffer),
    contentType: file.type || "application/octet-stream",
  });

  return NextResponse.json(upload, { status: 201 });
}
