"use client";

import { useState, useEffect, useRef } from "react";
import { updateCard, deleteCard } from "@/lib/actions/boards";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type { Card } from "./KanbanCard";

export type Member = {
  userId: string;
  name: string;
  image: string | null;
};

const LABEL_OPTIONS = [
  { id: "bug",     label: "Bug",     color: "#FF5F5F" },
  { id: "feature", label: "Feature", color: "#5B7FFF" },
  { id: "design",  label: "Design",  color: "#C084FC" },
  { id: "dev",     label: "Dev",     color: "#22D3EE" },
  { id: "blocked", label: "Blocked", color: "#FFB454" },
  { id: "review",  label: "Review",  color: "#5EFF8C" },
];

interface CardDetailProps {
  card: Card;
  members: Member[];
  onClose: () => void;
  onUpdated: (cardId: string, updates: Partial<Card>) => void;
  onDeleted: (cardId: string) => void;
}

export function CardDetail({
  card,
  members,
  onClose,
  onUpdated,
  onDeleted,
}: CardDetailProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [assigneeId, setAssigneeId] = useState<string | null>(card.assigneeId);
  const [labels, setLabels] = useState<string[]>(card.labels ?? []);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const debouncedTitle = useDebounce(title, 500);
  const debouncedDesc = useDebounce(description, 500);

  const initialTitle = useRef(card.title);
  const initialDesc = useRef(card.description ?? "");

  // Persist title changes
  useEffect(() => {
    if (debouncedTitle === initialTitle.current) return;
    updateCard(card.id, { title: debouncedTitle });
    onUpdated(card.id, { title: debouncedTitle });
  }, [debouncedTitle, card.id, onUpdated]);

  // Persist description changes
  useEffect(() => {
    if (debouncedDesc === initialDesc.current) return;
    updateCard(card.id, { description: debouncedDesc || null });
    onUpdated(card.id, { description: debouncedDesc || null });
  }, [debouncedDesc, card.id, onUpdated]);

  function handleAssignee(userId: string | null) {
    setAssigneeId(userId);
    updateCard(card.id, { assigneeId: userId });
    onUpdated(card.id, { assigneeId: userId });
  }

  function toggleLabel(id: string) {
    const next = labels.includes(id)
      ? labels.filter((l) => l !== id)
      : [...labels, id];
    setLabels(next);
    updateCard(card.id, { labels: next.length ? next : null });
    onUpdated(card.id, { labels: next.length ? next : null });
  }

  async function handleDelete() {
    await deleteCard(card.id);
    onDeleted(card.id);
    onClose();
  }

  const assignee = members.find((m) => m.userId === assigneeId);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-[420px] flex flex-col bg-bg-surface border-l border-border shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border gap-3">
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={2}
            className="flex-1 resize-none bg-transparent text-lg font-semibold text-text outline-none placeholder:text-text-faint leading-snug"
            placeholder="Card title"
          />
          <button
            onClick={onClose}
            className="mt-0.5 rounded-md p-1.5 text-text-faint hover:text-text hover:bg-bg-hover transition-colors flex-shrink-0"
          >
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 space-y-6">
          {/* Description */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-faint mb-2">
              Description
            </h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Add a description…"
              className="w-full resize-none rounded-lg bg-bg border border-border px-3 py-2 text-sm text-text placeholder:text-text-faint outline-none focus:border-accent transition-colors"
            />
          </section>

          {/* Assignee */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-faint mb-2">
              Assignee
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleAssignee(null)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border transition-colors ${
                  !assigneeId
                    ? "bg-accent/20 border-accent/50 text-accent"
                    : "border-border text-text-muted hover:border-border-strong hover:text-text"
                }`}
              >
                None
              </button>
              {members.map((m) => (
                <button
                  key={m.userId}
                  onClick={() => handleAssignee(m.userId)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border transition-colors ${
                    assigneeId === m.userId
                      ? "bg-accent/20 border-accent/50 text-accent"
                      : "border-border text-text-muted hover:border-border-strong hover:text-text"
                  }`}
                >
                  <Avatar name={m.name} image={m.image} size={16} />
                  {m.name}
                </button>
              ))}
            </div>
            {assignee && (
              <p className="mt-2 text-xs text-text-faint">
                Assigned to <span className="text-text-muted">{assignee.name}</span>
              </p>
            )}
          </section>

          {/* Labels */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-faint mb-2">
              Labels
            </h3>
            <div className="flex flex-wrap gap-2">
              {LABEL_OPTIONS.map((opt) => {
                const active = labels.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleLabel(opt.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border transition-all ${
                      active
                        ? "border-transparent text-bg font-medium"
                        : "border-border text-text-muted hover:border-border-strong"
                    }`}
                    style={active ? { backgroundColor: opt.color } : {}}
                  >
                    {!active && (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: opt.color }}
                      />
                    )}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted flex-1">
                Delete this card?
              </span>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-md px-3 py-1.5 text-xs text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full rounded-lg border border-border px-3 py-2 text-xs text-red-400 hover:border-red-400/50 hover:bg-red-400/5 transition-colors"
            >
              Delete card
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export function Avatar({
  name,
  image,
  size = 24,
}: {
  name: string;
  image: string | null;
  size?: number;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-full bg-accent/20 text-accent flex items-center justify-center font-medium flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="3" x2="13" y2="13" />
      <line x1="13" y1="3" x2="3" y2="13" />
    </svg>
  );
}
