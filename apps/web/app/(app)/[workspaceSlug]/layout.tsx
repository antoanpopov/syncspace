import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers, pages, boards } from "@syncspace/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Sidebar } from "@/components/workspace/Sidebar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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

  // Verify membership
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspace.id),
      eq(workspaceMembers.userId, userId)
    ),
  });

  if (!membership) notFound();

  const [workspacePages, workspaceBoards] = await Promise.all([
    db
      .select()
      .from(pages)
      .where(eq(pages.workspaceId, workspace.id))
      .orderBy(pages.sortOrder),
    db
      .select()
      .from(boards)
      .where(eq(boards.workspaceId, workspace.id))
      .orderBy(boards.sortOrder),
  ]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        workspace={workspace}
        pages={workspacePages}
        boards={workspaceBoards}
        userRole={membership.role}
        user={{
          name: session.user.name ?? "User",
          email: session.user.email ?? "",
          image: session.user.image ?? null,
        }}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
