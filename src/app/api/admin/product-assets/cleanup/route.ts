import { NextResponse } from "next/server";
import { auth, isAdminEmail } from "@/lib/auth";
import { deleteStorageFiles } from "@/lib/storage/deleteImages";

export const runtime = "nodejs";

type CleanupPayload = {
  urls?: string[];
};

function parseCleanupPayload(rawBody: string): CleanupPayload {
  if (!rawBody.trim()) return {};

  try {
    return JSON.parse(rawBody) as CleanupPayload;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rawBody = await request.text();
  const payload = parseCleanupPayload(rawBody);
  const urls = Array.isArray(payload.urls)
    ? payload.urls.filter(
        (value): value is string => typeof value === "string" && value.length > 0,
      )
    : [];

  await deleteStorageFiles(urls);

  return NextResponse.json({ success: true, deleted: urls.length });
}
