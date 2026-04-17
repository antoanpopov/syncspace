"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import type { Column } from "./KanbanColumn";
import { KanbanCard, type Card } from "./KanbanCard";
import { CardDetail, type Member } from "./CardDetail";
import { PresenceAvatars } from "@/components/shared/PresenceAvatars";
import { usePresence } from "@/lib/hooks/usePresence";
import {
  addCard,
  addColumn,
  persistCardMoves,
  persistColumnOrder,
  type CardUpdate,
} from "@/lib/actions/boards";
import { useBoardSocket, type CardAddPayload } from "@/lib/hooks/useBoardSocket";

interface KanbanBoardProps {
  boardId: string;
  boardTitle: string;
  initialColumns: Column[];
  members: Member[];
  currentUserId: string;
  currentUserName: string;
  currentUserColor: string;
}

export function KanbanBoard({
  boardId,
  boardTitle,
  initialColumns,
  members,
  currentUserId,
  currentUserName,
  currentUserColor,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  // ── Presence ─────────────────────────────────────────────────
  const { others: presentOthers } = usePresence({
    room: `board:${boardId}`,
    userId: currentUserId,
    userName: currentUserName,
    color: currentUserColor,
  });

  // ── Sensors ──────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Helpers ───────────────────────────────────────────────────
  function findCard(id: string): Card | null {
    for (const col of columns) {
      const c = col.cards.find((c) => c.id === id);
      if (c) return c;
    }
    return null;
  }

  function findColByCardId(cardId: string): Column | null {
    return columns.find((col) => col.cards.some((c) => c.id === cardId)) ?? null;
  }

  function findCol(id: string): Column | null {
    return columns.find((col) => col.id === id) ?? null;
  }

  function buildCardUpdates(cols: Column[]): CardUpdate[] {
    return cols.flatMap((col) =>
      col.cards.map((card, i) => ({
        id: card.id,
        columnId: col.id,
        sortOrder: i,
      }))
    );
  }

  // ── Socket ────────────────────────────────────────────────────
  const { emitCardsMoved, emitCardAdded } = useBoardSocket({
    boardId,
    onCardsMoved: ({ cards: updates }) => {
      setColumns((prev) => {
        const map = new Map(updates.map((u) => [u.id, u]));
        const allCards = prev.flatMap((col) => col.cards);
        return prev.map((col) => ({
          ...col,
          cards: allCards
            .filter(
              (card) =>
                (map.get(card.id)?.columnId ?? card.columnId) === col.id
            )
            .map((card) => {
              const u = map.get(card.id);
              return u
                ? { ...card, columnId: u.columnId, sortOrder: u.sortOrder }
                : card;
            })
            .sort((a, b) => a.sortOrder - b.sortOrder),
        }));
      });
    },
    onCardAdded: ({ card }: CardAddPayload) => {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === card.columnId
            ? {
                ...col,
                cards: [
                  ...col.cards,
                  {
                    ...card,
                    description: null,
                    assigneeId: null,
                    labels: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                ],
              }
            : col
        )
      );
    },
  });

  // ── DnD handlers ─────────────────────────────────────────────
  function onDragStart({ active }: DragStartEvent) {
    const type = active.data.current?.type;
    if (type === "column") {
      setActiveColumn(findCol(String(active.id)));
    } else {
      setActiveCard(findCard(String(active.id)));
    }
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    // Column drags are handled entirely in onDragEnd
    if (active.data.current?.type === "column") return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const sourceCol = findColByCardId(activeId);
    // Resolve the target column — over could be a card, a column ID, or a drop-zone ID
    const targetCol =
      findCol(overId) ??
      findCol(overId.replace("drop-", "")) ??
      findColByCardId(overId);

    if (!sourceCol || !targetCol || sourceCol.id === targetCol.id) return;

    // Cross-column move — live visual feedback
    setColumns((prev) => {
      const card = prev.flatMap((c) => c.cards).find((c) => c.id === activeId);
      if (!card) return prev;

      return prev.map((col) => {
        if (col.id === sourceCol.id) {
          return { ...col, cards: col.cards.filter((c) => c.id !== activeId) };
        }
        if (col.id === targetCol.id) {
          const overIdx = col.cards.findIndex((c) => c.id === overId);
          const newCards = [...col.cards];
          const moved = { ...card, columnId: targetCol.id };
          if (overIdx >= 0) newCards.splice(overIdx, 0, moved);
          else newCards.push(moved);
          return { ...col, cards: newCards };
        }
        return col;
      });
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveCard(null);
    setActiveColumn(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // ── Column reorder ──────────────────────────────────────────
    if (active.data.current?.type === "column") {
      const oldIdx = columns.findIndex((c) => c.id === activeId);
      const newIdx = columns.findIndex((c) => c.id === overId);
      if (oldIdx !== newIdx && newIdx !== -1) {
        const reordered = arrayMove(columns, oldIdx, newIdx);
        setColumns(reordered);
        persistColumnOrder(
          reordered.map((col, i) => ({ id: col.id, sortOrder: i }))
        );
      }
      return;
    }

    // ── Card reorder within same column ─────────────────────────
    const activeCol = findColByCardId(activeId);
    if (!activeCol) return;

    const isReorderInSameCol =
      activeCol.cards.some((c) => c.id === overId) && activeId !== overId;

    let finalColumns = columns;

    if (isReorderInSameCol) {
      const oldIdx = activeCol.cards.findIndex((c) => c.id === activeId);
      const newIdx = activeCol.cards.findIndex((c) => c.id === overId);
      finalColumns = columns.map((col) =>
        col.id === activeCol.id
          ? { ...col, cards: arrayMove(col.cards, oldIdx, newIdx) }
          : col
      );
      setColumns(finalColumns);
    }

    // Persist + broadcast
    const updates = buildCardUpdates(finalColumns);
    persistCardMoves(updates);
    emitCardsMoved({ cards: updates });
  }

  // ── Add card ──────────────────────────────────────────────────
  async function handleAddCard(columnId: string, title: string) {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Card = {
      id: tempId,
      boardId,
      columnId,
      title,
      description: null,
      assigneeId: null,
      labels: null,
      sortOrder: columns.find((c) => c.id === columnId)?.cards.length ?? 0,
      createdById: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? { ...col, cards: [...col.cards, optimistic] }
          : col
      )
    );

    const card = await addCard(boardId, columnId, title);

    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? {
              ...col,
              cards: col.cards.map((c) =>
                c.id === tempId ? { ...optimistic, ...card } : c
              ),
            }
          : col
      )
    );

    emitCardAdded({
      card: {
        ...card,
        description: null,
        assigneeId: null,
        labels: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // ── Card detail callbacks ─────────────────────────────────────
  function handleCardUpdated(cardId: string, updates: Partial<Card>) {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === cardId ? { ...c, ...updates } : c
        ),
      }))
    );
    setSelectedCard((prev) =>
      prev?.id === cardId ? { ...prev, ...updates } : prev
    );
  }

  function handleCardDeleted(cardId: string) {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      }))
    );
  }

  // ── Add column ────────────────────────────────────────────────
  async function handleAddColumn() {
    const trimmed = newColumnTitle.trim();
    if (!trimmed) return;
    const col = await addColumn(boardId, trimmed);
    setColumns((prev) => [...prev, { ...col, cards: [] }]);
    setNewColumnTitle("");
    setAddingColumn(false);
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex-shrink-0 flex items-center justify-between">
        <h1 className="text-xl font-bold">{boardTitle}</h1>
        <PresenceAvatars users={presentOthers} />
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          {/* SortableContext for columns (horizontal) */}
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-4 p-6 h-full items-start w-max">
              {columns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  id={col.id}
                  title={col.title}
                  color={col.color}
                  cards={col.cards}
                  onAddCard={handleAddCard}
                  onCardClick={setSelectedCard}
                />
              ))}

              {/* Add column */}
              {addingColumn ? (
                <div className="w-72 flex-shrink-0 rounded-xl border border-border bg-bg-surface p-3 space-y-2">
                  <input
                    autoFocus
                    type="text"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddColumn();
                      if (e.key === "Escape") {
                        setAddingColumn(false);
                        setNewColumnTitle("");
                      }
                    }}
                    placeholder="Column title…"
                    className="w-full rounded-md bg-bg border border-border px-2 py-1.5 text-sm outline-none focus:border-accent"
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleAddColumn}
                      className="flex-1 rounded-md bg-accent px-2 py-1 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
                    >
                      Add column
                    </button>
                    <button
                      onClick={() => {
                        setAddingColumn(false);
                        setNewColumnTitle("");
                      }}
                      className="rounded-md px-2 py-1 text-xs text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingColumn(true)}
                  className="w-72 flex-shrink-0 rounded-xl border border-dashed border-border hover:border-border-strong text-text-faint hover:text-text-muted text-sm transition-colors px-4 py-3 text-left"
                >
                  + Add column
                </button>
              )}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
            {activeCard ? (
              <KanbanCard card={activeCard} overlay />
            ) : activeColumn ? (
              <KanbanColumn
                id={activeColumn.id}
                title={activeColumn.title}
                color={activeColumn.color}
                cards={activeColumn.cards}
                onAddCard={() => {}}
                onCardClick={() => {}}
                overlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Card detail slide-over */}
      {selectedCard && (
        <CardDetail
          card={selectedCard}
          members={members}
          onClose={() => setSelectedCard(null)}
          onUpdated={handleCardUpdated}
          onDeleted={handleCardDeleted}
        />
      )}
    </div>
  );
}
