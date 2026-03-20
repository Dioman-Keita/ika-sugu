import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSupabaseServiceClient, parseStoragePath } from "@/lib/supabase/server";

const assertAdmin = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const userEmail = session.user?.email?.toLowerCase();
  return Boolean(userEmail && adminEmails.includes(userEmail));
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await assertAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: productId } = await params;
  const body = await req.json();
  const images = Array.isArray(body.images)
    ? (body.images as Array<{ url: string; isCover?: boolean }>)
    : [];

  const urls = images.map((i) => i.url);

  await db.$transaction(async (tx) => {
    const variants = await tx.productVariant.findMany({ where: { productId } });
    if (!variants.length) throw new Error("Product variants not found");

    await Promise.all(
      variants.map((variant) =>
        tx.productVariant.update({
          where: { id: variant.id },
          data: { images: { set: urls } },
        }),
      ),
    );
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const isAdmin = await assertAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const { bucket, path } = parseStoragePath(url);
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required to delete the file from storage" },
      { status: 501 },
    );
  }

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const variants = await db.productVariant.findMany({ where: { images: { has: url } } });
  await Promise.all(
    variants.map((variant) =>
      db.productVariant.update({
        where: { id: variant.id },
        data: { images: { set: variant.images.filter((img) => img !== url) } },
      }),
    ),
  );

  return NextResponse.json({ ok: true, bucket, path });
}
