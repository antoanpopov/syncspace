import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pages, workspaceMembers, workspaces, users } from "@syncspace/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { PageEditor } from "@/components/editor/PageEditor";

export default async function PageView({
  params,
}: {
  params: Promise<{ workspaceSlug: string; pageId: string }>;
}) {
  const { pageId, workspaceSlug } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const userId = session.user.id;
  const userName = session.user.name;

  const [page, workspace] = await Promise.all([
    db.query.pages.findFirst({ where: eq(pages.id, pageId) }),
    db.query.workspaces.findFirst({ where: eq(workspaces.slug, workspaceSlug) }),
  ]);

  if (!page || !workspace) notFound();

  // Fetch workspace members with their user info for @mentions
  const memberRows = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspace.id));

  return (
    <PageEditor
      pageId={pageId}
      workspaceSlug={workspaceSlug}
      initialTitle={page.title}
      initialIcon={page.icon}
      userId={userId}
      userName={userName ?? "Anonymous"}
      members={memberRows}
    />
  );
}
