import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers, pages, boards } from "@syncspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, LayoutGrid, Users, ArrowRight } from "lucide-react";

export default async function WorkspaceDashboard({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  const session = await auth();

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, workspaceSlug),
  });
  if (!workspace) notFound();

  const [workspacePages, workspaceBoards, memberRows] = await Promise.all([
    db
      .select()
      .from(pages)
      .where(eq(pages.workspaceId, workspace.id))
      .orderBy(desc(pages.updatedAt))
      .limit(6),
    db
      .select()
      .from(boards)
      .where(eq(boards.workspaceId, workspace.id))
      .orderBy(desc(boards.updatedAt))
      .limit(6),
    db
      .select({ userId: workspaceMembers.userId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspace.id)),
  ]);

  const membersCount = memberRows.length;
  const initials = workspace.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isEmpty = workspacePages.length === 0 && workspaceBoards.length === 0;

  return (
    <div className="min-h-full p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent font-bold text-lg flex-shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-none">{workspace.name}</h1>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-text-faint">
            <span className="font-mono">{workspace.slug}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {membersCount} {membersCount === 1 ? "member" : "members"}
            </span>
            <span>·</span>
            <span>{workspacePages.length} pages · {workspaceBoards.length} boards</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/${workspaceSlug}/pages/new`}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-text hover:border-border-strong hover:bg-bg-hover transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New page
        </Link>
        <Link
          href={`/${workspaceSlug}/boards/new`}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-text hover:border-border-strong hover:bg-bg-hover transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New board
        </Link>
        <Link
          href={`/${workspaceSlug}/settings/members`}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-text hover:border-border-strong hover:bg-bg-hover transition-colors"
        >
          <Users className="h-3.5 w-3.5" />
          Invite members
        </Link>
      </div>

      {isEmpty ? (
        /* ── First-time empty state ──────────────────────────────────────── */
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <div className="text-4xl mb-4">✨</div>
          <h2 className="text-lg font-semibold mb-2">Your workspace is empty</h2>
          <p className="text-sm text-text-muted mb-6 max-w-sm mx-auto">
            Create your first page to start writing, or a board to track tasks with your team.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href={`/${workspaceSlug}/pages/new`}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              <FileText className="h-4 w-4" />
              Create a page
            </Link>
            <Link
              href={`/${workspaceSlug}/boards/new`}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:text-text hover:border-border-strong transition-colors"
            >
              <LayoutGrid className="h-4 w-4" />
              Create a board
            </Link>
          </div>
        </div>
      ) : (
        /* ── Content grid ────────────────────────────────────────────────── */
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pages */}
          <section className="rounded-xl border border-border bg-bg-surface overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <FileText className="h-4 w-4 text-text-faint" />
              <h2 className="text-sm font-semibold">Pages</h2>
              <span className="ml-auto text-xs text-text-faint tabular-nums">
                {workspacePages.length}
              </span>
            </div>

            {workspacePages.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-text-faint mb-3">No pages yet</p>
                <Link
                  href={`/${workspaceSlug}/pages/new`}
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Create your first page
                </Link>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {workspacePages.map((page) => (
                    <li key={page.id}>
                      <Link
                        href={`/${workspaceSlug}/pages/${page.id}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-bg-hover transition-colors group"
                      >
                        <span className="text-base flex-shrink-0">{page.icon || "📄"}</span>
                        <span className="flex-1 text-sm truncate">{page.title}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-text-faint opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="px-5 py-3 border-t border-border">
                  <Link
                    href={`/${workspaceSlug}/pages/new`}
                    className="flex items-center gap-1.5 text-xs text-text-faint hover:text-text-muted transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    New page
                  </Link>
                </div>
              </>
            )}
          </section>

          {/* Boards */}
          <section className="rounded-xl border border-border bg-bg-surface overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <LayoutGrid className="h-4 w-4 text-text-faint" />
              <h2 className="text-sm font-semibold">Boards</h2>
              <span className="ml-auto text-xs text-text-faint tabular-nums">
                {workspaceBoards.length}
              </span>
            </div>

            {workspaceBoards.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-text-faint mb-3">No boards yet</p>
                <Link
                  href={`/${workspaceSlug}/boards/new`}
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Create your first board
                </Link>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {workspaceBoards.map((board) => (
                    <li key={board.id}>
                      <Link
                        href={`/${workspaceSlug}/boards/${board.id}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-bg-hover transition-colors group"
                      >
                        <span className="text-base flex-shrink-0">{board.icon || "📋"}</span>
                        <span className="flex-1 text-sm truncate">{board.title}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-text-faint opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="px-5 py-3 border-t border-border">
                  <Link
                    href={`/${workspaceSlug}/boards/new`}
                    className="flex items-center gap-1.5 text-xs text-text-faint hover:text-text-muted transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    New board
                  </Link>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
