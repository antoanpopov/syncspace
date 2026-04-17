import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { boards, boardColumns, workspaces } from "@syncspace/db/schema";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { generateId } from "@/lib/utils";

export default async function NewBoardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, workspaceSlug),
  });
  if (!workspace) notFound();

  async function createBoard(formData: FormData) {
    "use server";

    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const title = formData.get("title") as string;
    if (!title?.trim()) throw new Error("Title is required");

    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.slug, workspaceSlug),
    });
    if (!workspace) throw new Error("Workspace not found");

    const boardId = generateId();
    await db.insert(boards).values({
      id: boardId,
      workspaceId: workspace.id,
      title: title.trim(),
      createdById: session.user.id,
    });

    // Create default columns
    const defaultColumns = ["To Do", "In Progress", "Done"];
    await db.insert(boardColumns).values(
      defaultColumns.map((title, i) => ({
        id: generateId(),
        boardId,
        title,
        sortOrder: i,
      }))
    );

    revalidatePath(`/${workspaceSlug}`, "layout");
    redirect(`/${workspaceSlug}/boards/${boardId}`);
  }

  return (
    <div className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-bold mb-2">New board</h1>
      <p className="text-sm text-text-muted mb-6">
        Boards have columns and cards for tracking work.
      </p>

      <form action={createBoard} className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="mb-1.5 block text-sm font-medium text-text-muted"
          >
            Board title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            autoFocus
            placeholder="e.g. Sprint Board"
            className="w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint outline-none transition-colors focus:border-accent"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover cursor-pointer"
        >
          Create board
        </button>
      </form>
    </div>
  );
}
