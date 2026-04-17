"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { boardCards, boardColumns } from "@syncspace/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export type CardUpdate = {
  id: string;
  columnId: string;
  sortOrder: number;
};

/** Add a new card to a column and return it. */
export async function addCard(boardId: string, columnId: string, title: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await db
    .select({ id: boardCards.id })
    .from(boardCards)
    .where(eq(boardCards.columnId, columnId));

  const card = {
    id: generateId(),
    boardId,
    columnId,
    title: title.trim(),
    sortOrder: existing.length,
    createdById: session.user.id,
  };

  await db.insert(boardCards).values(card);
  return card;
}

/** Batch-persist new columnId + sortOrder for every card affected by a drag. */
export async function persistCardMoves(updates: CardUpdate[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await Promise.all(
    updates.map((u) =>
      db
        .update(boardCards)
        .set({ columnId: u.columnId, sortOrder: u.sortOrder, updatedAt: new Date() })
        .where(eq(boardCards.id, u.id))
    )
  );
}

const COLUMN_COLORS = [
  "#5B7FFF", "#22D3EE", "#5EFF8C", "#FFB454",
  "#C084FC", "#FF5F5F", "#FB923C", "#F472B6",
];

/** Add a new column to a board and return it. Auto-assigns a color from the palette. */
export async function addColumn(boardId: string, title: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await db
    .select({ id: boardColumns.id })
    .from(boardColumns)
    .where(eq(boardColumns.boardId, boardId));

  const column = {
    id: generateId(),
    boardId,
    title: title.trim(),
    sortOrder: existing.length,
    color: COLUMN_COLORS[existing.length % COLUMN_COLORS.length],
  };

  await db.insert(boardColumns).values(column);
  return column;
}

export type ColumnOrderUpdate = { id: string; sortOrder: number };

/** Batch-persist new sortOrder for all columns after a drag reorder. */
export async function persistColumnOrder(updates: ColumnOrderUpdate[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await Promise.all(
    updates.map((u) =>
      db
        .update(boardColumns)
        .set({ sortOrder: u.sortOrder })
        .where(eq(boardColumns.id, u.id))
    )
  );
}

/** Update mutable card fields. */
export async function updateCard(
  cardId: string,
  updates: {
    title?: string;
    description?: string | null;
    assigneeId?: string | null;
    labels?: string[] | null;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await db
    .update(boardCards)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(boardCards.id, cardId));
}

/** Delete a card. */
export async function deleteCard(cardId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await db.delete(boardCards).where(eq(boardCards.id, cardId));
}
