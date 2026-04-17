import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers } from "@syncspace/db/schema";
import { redirect } from "next/navigation";
import { generateId, slugify } from "@/lib/utils";

export default async function NewWorkspacePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  async function createWorkspace(formData: FormData) {
    "use server";

    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    if (!name?.trim()) throw new Error("Name is required");

    const id = generateId();
    const slug = slugify(name) + "-" + id.slice(0, 6);

    await db.insert(workspaces).values({
      id,
      name: name.trim(),
      slug,
      ownerId: session.user.id,
    });

    await db.insert(workspaceMembers).values({
      workspaceId: id,
      userId: session.user.id,
      role: "owner",
    });

    redirect(`/${slug}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <h1 className="mb-2 text-2xl font-bold">Create workspace</h1>
        <p className="mb-8 text-sm text-text-muted">
          A workspace is where your team collaborates on pages and boards.
        </p>

        <form action={createWorkspace} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-text-muted"
            >
              Workspace name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoFocus
              placeholder="e.g. Acme Inc"
              className="w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint outline-none transition-colors focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover cursor-pointer"
          >
            Create workspace
          </button>
        </form>
      </div>
    </div>
  );
}
