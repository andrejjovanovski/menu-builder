import { NextRequest, NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireAppSession } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  const { error, session } = await requireAppSession();
  if (error || !session) {
    return error;
  }

  const body = await request.json();
  const categories = Array.isArray(body.categories) ? body.categories : [];

  if (categories.length === 0) {
    return NextResponse.json({ error: "Categories are required" }, { status: 400 });
  }

  const firstId = categories[0]?.id;
  const lookup = await withTransaction(async (client) => {
    const categoryResult = await client.query(
      `select c.restaurant_id, r.owner_id
       from menu_categories c
       join restaurants r on r.id = c.restaurant_id
       where c.id = $1
       limit 1`,
      [firstId]
    );

    const category = categoryResult.rows[0];
    if (!category) {
      return { status: 404 as const };
    }

    if (session.role !== "admin" && category.owner_id !== session.user.id) {
      return { status: 403 as const };
    }

    for (const item of categories) {
      await client.query(
        'update menu_categories set "order" = $1, updated_at = now() where id = $2',
        [item.order, item.id]
      );
    }

    return { status: 200 as const };
  });

  if (lookup.status === 404) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (lookup.status === 403) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
