import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pages } from "@syncspace/db/schema";
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

  const page = await db.query.pages.findFirst({
    where: eq(pages.id, pageId),
  });

  if (!page) notFound();

  return (
    <PageEditor
      pageId={pageId}
      workspaceSlug={workspaceSlug}
      initialTitle={page.title}
      userId={session.user.id}
      userName={session.user.name ?? "Anonymous"}
    />
  );
}
