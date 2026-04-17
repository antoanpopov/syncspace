import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workspaces, pages, boards } from "@syncspace/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, LayoutGrid } from "lucide-react";

export default async function WorkspaceDashboard({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, workspaceSlug),
  });

  if (!workspace) notFound();

  const [workspacePages, workspaceBoards] = await Promise.all([
    db.select().from(pages).where(eq(pages.workspaceId, workspace.id)),
    db.select().from(boards).where(eq(boards.workspaceId, workspace.id)),
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1">{workspace.name}</h1>
      <p className="text-text-muted text-sm mb-8">
        Welcome to your workspace
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-bg-surface p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-text-muted" />
            <h2 className="font-semibold">Pages</h2>
            <span className="ml-auto text-sm text-text-faint">
              {workspacePages.length}
            </span>
          </div>
          {workspacePages.length === 0 ? (
            <p className="text-sm text-text-muted">No pages yet</p>
          ) : (
            <ul className="space-y-1">
              {workspacePages.slice(0, 5).map((page) => (
                <li key={page.id}>
                  <Link
                    href={`/${workspaceSlug}/pages/${page.id}`}
                    className="block text-sm py-1 hover:text-accent transition-colors"
                  >
                    {page.icon || "📄"} {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-bg-surface p-6">
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="h-5 w-5 text-text-muted" />
            <h2 className="font-semibold">Boards</h2>
            <span className="ml-auto text-sm text-text-faint">
              {workspaceBoards.length}
            </span>
          </div>
          {workspaceBoards.length === 0 ? (
            <p className="text-sm text-text-muted">No boards yet</p>
          ) : (
            <ul className="space-y-1">
              {workspaceBoards.slice(0, 5).map((board) => (
                <li key={board.id}>
                  <Link
                    href={`/${workspaceSlug}/boards/${board.id}`}
                    className="block text-sm py-1 hover:text-accent transition-colors"
                  >
                    {board.icon || "📋"} {board.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
