"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers } from "@syncspace/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/** Rename a workspace (keeps the slug unchanged to avoid broken URLs). */
export async function updateWorkspaceName(
  workspaceId: string,
  name: string,
  workspaceSlug: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Only owners/admins can rename
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, session.user.id)
    ),
  });
  if (!membership || membership.role === "member") throw new Error("Forbidden");

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name cannot be empty");

  await db
    .update(workspaces)
    .set({ name: trimmed, updatedAt: new Date() })
    .where(eq(workspaces.id, workspaceId));

  revalidatePath(`/${workspaceSlug}`, "layout");
}
