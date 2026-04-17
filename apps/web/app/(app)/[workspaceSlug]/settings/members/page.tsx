import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers, users } from "@syncspace/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { MembersClient } from "@/components/workspace/MembersClient";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const userId = session.user.id;

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, workspaceSlug),
  });
  if (!workspace) notFound();

  const myMembership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspace.id),
      eq(workspaceMembers.userId, userId)
    ),
  });
  if (!myMembership) notFound();

  const memberRows = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, workspace.id))
    .orderBy(workspaceMembers.joinedAt);

  const members = memberRows.map((m) => ({
    ...m,
    isMe: m.userId === userId,
  }));

  const canManage =
    myMembership.role === "owner" || myMembership.role === "admin";

  return (
    <MembersClient
      workspaceId={workspace.id}
      members={members}
      canManage={canManage}
    />
  );
}
