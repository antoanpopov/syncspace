import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers } from "@syncspace/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function WorkspacesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const userId = session.user.id;

  const userWorkspaces = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId));

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-lg px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Workspaces</h1>
            <p className="text-sm text-text-muted">
              Select a workspace or create a new one
            </p>
          </div>
          <Link
            href="/workspaces/new"
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" />
            New
          </Link>
        </div>

        {userWorkspaces.length === 0 ? (
          <div className="rounded-lg border border-border bg-bg-surface p-8 text-center">
            <p className="text-text-muted">No workspaces yet</p>
            <Link
              href="/workspaces/new"
              className="mt-4 inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover"
            >
              <Plus className="h-4 w-4" />
              Create your first workspace
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {userWorkspaces.map((ws) => (
              <Link
                key={ws.id}
                href={`/${ws.slug}`}
                className="flex items-center justify-between rounded-lg border border-border bg-bg-surface p-4 transition-colors hover:bg-bg-hover"
              >
                <div>
                  <p className="font-medium">{ws.name}</p>
                  <p className="text-sm text-text-muted">{ws.role}</p>
                </div>
                <span className="text-text-faint">&rarr;</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
