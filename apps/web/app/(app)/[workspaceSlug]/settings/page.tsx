import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers } from "@syncspace/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { WorkspaceSettings } from "@/components/workspace/WorkspaceSettings";

export default async function SettingsPage({
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

  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspace.id),
      eq(workspaceMembers.userId, userId)
    ),
  });
  if (!membership) notFound();

  return (
    <WorkspaceSettings
      workspaceId={workspace.id}
      workspaceSlug={workspace.slug}
      initialName={workspace.name}
      userRole={membership.role}
    />
  );
}
