"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pages } from "@syncspace/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updatePageTitle(
  pageId: string,
  title: string,
  workspaceSlug: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(pages)
    .set({ title: title.trim() || "Untitled", updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  revalidatePath(`/${workspaceSlug}`, "layout");
}
