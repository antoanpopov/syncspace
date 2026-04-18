"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanCard, type Card } from "./KanbanCard";
import { updateColumnTitle } from "@/lib/actions/boards";

export type Column = {
  id: string;
  boardId: string;
  title: string;
  sortOrder: number;
  color: string | null;
  cards: Card[];
};

interface Member {
  userId: string;
  name: string;
  image: string | null;
}

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string | null;
  cards: Card[];
  members?: Member[];
  onAddCard: (columnId: string, title: string) => void;
  onCardClick: (card: Card) => void;
  /** True when rendered inside DragOverlay */
  overlay?: boolean;
}

export function KanbanColumn({
  id,
  title,
  color,
  cards,
  members = [],
  onAddCard,
  onCardClick,
  overlay = false,
}: KanbanColumnProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [displayTitle, setDisplayTitle] = useState(title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  function handleTitleSave() {
    const trimmed = editTitle.trim() || title;
    setDisplayTitle(trimmed);
    setEditTitle(trimmed);
    setIsEditingTitle(false);
    if (trimmed !== displayTitle) updateColumnTitle(id, trimmed);
  }

  // Sortable for the column itself (reordering columns)
  const {
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({ id, data: { type: "column" } });

  // Separate droppable zone for card drops inside this column
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `drop-${id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleAdd() {
    const trimmed = draft.trim();
    if (trimmed) {
      onAddCard(id, trimmed);
      setDraft("");
      setAdding(false);
    }
  }

  if (isDragging && !overlay) {
    return (
      <div
        ref={setSortableRef}
        style={style}
        className="w-72 flex-shrink-0 rounded-xl border border-dashed border-border bg-bg-surface/40 min-h-[120px]"
      />
    );
  }

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={`w-72 flex-shrink-0 flex flex-col rounded-xl border transition-colors ${
        overlay
          ? "shadow-2xl rotate-1 border-border"
          : isOver
          ? "border-accent/60 bg-accent/5"
          : "border-border bg-bg-surface"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
        {/* Color indicator */}
        {color && (
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        )}

        {isEditingTitle && !overlay ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSave();
              if (e.key === "Escape") {
                setEditTitle(displayTitle);
                setIsEditingTitle(false);
              }
            }}
            className="flex-1 bg-transparent text-sm font-semibold outline-none border-b border-accent min-w-0"
          />
        ) : (
          <h3
            className={`flex-1 text-sm font-semibold truncate ${!overlay ? "cursor-text" : ""}`}
            onClick={() => !overlay && (setEditTitle(displayTitle), setIsEditingTitle(true))}
            title={overlay ? undefined : "Click to rename"}
          >
            {displayTitle}
          </h3>
        )}

        <span className="text-xs text-text-faint tabular-nums mr-1">
          {cards.length}
        </span>

        {/* Drag handle — only active handle, so clicking title/buttons doesn't drag */}
        {!overlay && (
          <button
            {...attributes}
            {...listeners}
            className="p-0.5 rounded text-text-faint hover:text-text-muted hover:bg-bg-hover transition-colors cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag column"
          >
            <GripIcon />
          </button>
        )}
      </div>

      {/* Card list */}
      <div ref={setDropRef} className="flex-1 p-2 space-y-2 min-h-[60px]">
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              assignee={members.find((m) => m.userId === card.assigneeId) ?? null}
              onClick={onCardClick}
            />
          ))}
        </SortableContext>
        {cards.length === 0 && !overlay && (
          <div className="flex items-center justify-center py-5 rounded-md border border-dashed border-border/50">
            <p className="text-[11px] text-text-faint">Drop cards here</p>
          </div>
        )}
      </div>

      {/* Add card footer */}
      {!overlay && (
        <div className="p-2 border-t border-border">
          {adding ? (
            <div className="space-y-1.5">
              <textarea
                autoFocus
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAdd();
                  }
                  if (e.key === "Escape") {
                    setAdding(false);
                    setDraft("");
                  }
                }}
                placeholder="Card title…"
                className="w-full resize-none rounded-md bg-bg border border-border px-2 py-1.5 text-sm outline-none focus:border-accent"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={handleAdd}
                  className="flex-1 rounded-md bg-accent px-2 py-1 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setAdding(false);
                    setDraft("");
                  }}
                  className="rounded-md px-2 py-1 text-xs text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full text-left flex items-center gap-1 text-xs text-text-faint hover:text-text-muted transition-colors py-0.5"
            >
              <span className="text-base leading-none">+</span>
              <span>Add card</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function GripIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="5" cy="3.5" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="3.5" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="5" cy="7" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="7" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="5" cy="10.5" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="10.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
