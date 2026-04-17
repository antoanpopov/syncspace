import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  boards,
  boardColumns,
  boardCards,
  workspaces,
  workspaceMembers,
  users,
} from "@syncspace/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { getUserColor } from "@/lib/utils";

const PALETTE = [
  "#5B7FFF", "#22D3EE", "#5EFF8C", "#FFB454",
  "#C084FC", "#FF5F5F", "#FB923C", "#F472B6",
];

export default async function BoardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; boardId: string }>;
}) {
  const { workspaceSlug, boardId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [board, workspace] = await Promise.all([
    db.query.boards.findFirst({ where: eq(boards.id, boardId) }),
    db.query.workspaces.findFirst({ where: eq(workspaces.slug, workspaceSlug) }),
  ]);
  if (!board || !workspace) notFound();

  const [columns, cards, memberRows] = await Promise.all([
    db.select().from(boardColumns).where(eq(boardColumns.boardId, boardId)).orderBy(boardColumns.sortOrder),
    db.select().from(boardCards).where(eq(boardCards.boardId, boardId)).orderBy(boardCards.sortOrder),
    db
      .select({ userId: users.id, name: users.name, image: users.image })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, workspace.id)),
  ]);

  const initialColumns = columns.map((col, i) => ({
    ...col,
    color: col.color ?? PALETTE[i % PALETTE.length],
    cards: cards.filter((c) => c.columnId === col.id),
  }));

  return (
    <KanbanBoard
      boardId={boardId}
      boardTitle={board.title}
      initialColumns={initialColumns}
      members={memberRows}
      currentUserId={session.user.id}
      currentUserName={session.user.name ?? "User"}
      currentUserColor={getUserColor(session.user.id)}
    />
  );
}
