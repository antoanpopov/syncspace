"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  invitations,
  workspaceMembers,
  workspaces,
  users,
} from "@syncspace/db/schema";
import { eq, and } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { revalidatePath } from "next/cache";

/** Create an invitation for an email address and return the invite URL. */
export async function createInvitation(workspaceId: string, email: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });
  if (!workspace) throw new Error("Workspace not found");

  // Prevent duplicate pending invites for the same email
  const existing = await db.query.invitations.findFirst({
    where: and(
      eq(invitations.workspaceId, workspaceId),
      eq(invitations.email, email.toLowerCase()),
      eq(invitations.status, "pending")
    ),
  });
  if (existing) return existing.token;

  const token = generateId();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(invitations).values({
    id: generateId(),
    workspaceId,
    email: email.toLowerCase(),
    invitedById: session.user.id,
    token,
    status: "pending",
    expiresAt,
  });

  return token;
}

/** Accept an invitation by token. Adds the current user to the workspace. */
export async function acceptInvitation(token: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.token, token),
  });

  if (!invitation) throw new Error("Invitation not found");
  if (invitation.status !== "pending") throw new Error("Invitation already used");
  if (invitation.expiresAt < new Date()) throw new Error("Invitation expired");

  // Check if already a member
  const existing = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, invitation.workspaceId),
      eq(workspaceMembers.userId, session.user.id)
    ),
  });

  if (!existing) {
    await db.insert(workspaceMembers).values({
      workspaceId: invitation.workspaceId,
      userId: session.user.id,
      role: "member",
    });
  }

  await db
    .update(invitations)
    .set({ status: "accepted" })
    .where(eq(invitations.token, token));

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, invitation.workspaceId),
  });

  return workspace?.slug ?? null;
}

/** Remove a member from a workspace. */
export async function removeMember(workspaceId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Only owners/admins can remove members
  const myMembership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, session.user.id)
    ),
  });
  if (!myMembership || myMembership.role === "member") throw new Error("Forbidden");

  await db
    .delete(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      )
    );

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });
  if (workspace) revalidatePath(`/${workspace.slug}`, "layout");
}
