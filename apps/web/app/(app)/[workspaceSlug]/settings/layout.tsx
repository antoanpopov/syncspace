import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers } from "@syncspace/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { SettingsNav } from "./SettingsNav";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, workspaceSlug),
  });
  if (!workspace) notFound();

  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspace.id),
      eq(workspaceMembers.userId, session.user.id)
    ),
  });
  if (!membership) notFound();

  return (
    <div className="min-h-full">
      <div className="border-b border-border bg-bg-surface px-8 pt-8 pb-0">
        <h1 className="text-xl font-bold mb-4">Settings</h1>
        <SettingsNav workspaceSlug={workspaceSlug} />
      </div>
      <div>{children}</div>
    </div>
  );
}
