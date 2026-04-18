"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CollaborativeEditor, getUserColor, type MentionMember } from "./CollaborativeEditor";
import { updatePageTitle, updatePageIcon } from "@/lib/actions/pages";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { usePageSocket } from "@/lib/hooks/usePageSocket";
import { EmojiPicker } from "@/components/shared/EmojiPicker";

interface PageEditorProps {
  pageId: string;
  workspaceSlug: string;
  initialTitle: string;
  initialIcon: string | null;
  userId: string;
  userName: string;
  members?: MentionMember[];
}

export function PageEditor({
  pageId,
  workspaceSlug,
  initialTitle,
  initialIcon,
  userId,
  userName,
  members = [],
}: PageEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [icon, setIcon] = useState<string | null>(initialIcon);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [, startTransition] = useTransition();
  const debouncedTitle = useDebounce(title, 600);
  const userColor = getUserColor(userId);

  // Receive title changes from other clients
  const { emitTitleUpdate } = usePageSocket({
    pageId,
    onTitleUpdate: (newTitle) => {
      setTitle(newTitle);
      router.refresh();
    },
  });

  // Persist + broadcast title changes (debounced)
  useEffect(() => {
    if (debouncedTitle === initialTitle) return;
    startTransition(async () => {
      await updatePageTitle(pageId, debouncedTitle, workspaceSlug);
      emitTitleUpdate(debouncedTitle);
      router.refresh();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, pageId, workspaceSlug]);

  const handleIconSelect = useCallback(
    (emoji: string) => {
      setIcon(emoji);
      startTransition(async () => {
        await updatePageIcon(pageId, emoji, workspaceSlug);
        router.refresh();
      });
    },
    [pageId, workspaceSlug, router]
  );

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      {/* Emoji icon */}
      <div className="relative inline-block mb-3">
        <button
          type="button"
          onClick={() => setShowEmojiPicker((v) => !v)}
          title="Change icon"
          className="text-4xl leading-none rounded-lg p-1.5 hover:bg-bg-hover transition-colors select-none"
        >
          {icon ?? "📄"}
        </button>
        {showEmojiPicker && (
          <EmojiPicker
            onSelect={handleIconSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled"
        className="w-full bg-transparent text-3xl font-bold text-text placeholder:text-text-faint outline-none mb-6 leading-tight"
      />

      <CollaborativeEditor
        pageId={pageId}
        userName={userName}
        userColor={userColor}
        members={members}
      />
    </div>
  );
}
