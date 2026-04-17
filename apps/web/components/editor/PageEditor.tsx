"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CollaborativeEditor, getUserColor } from "./CollaborativeEditor";
import { updatePageTitle } from "@/lib/actions/pages";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { usePageSocket } from "@/lib/hooks/usePageSocket";

interface PageEditorProps {
  pageId: string;
  workspaceSlug: string;
  initialTitle: string;
  userId: string;
  userName: string;
}

export function PageEditor({
  pageId,
  workspaceSlug,
  initialTitle,
  userId,
  userName,
}: PageEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [, startTransition] = useTransition();
  const debouncedTitle = useDebounce(title, 600);
  const userColor = getUserColor(userId);

  // Receive title changes from other clients
  const { emitTitleUpdate } = usePageSocket({
    pageId,
    onTitleUpdate: (newTitle) => {
      setTitle(newTitle);
      router.refresh(); // update this client's sidebar
    },
  });

  // Persist + broadcast title changes (debounced)
  useEffect(() => {
    if (debouncedTitle === initialTitle) return;
    startTransition(async () => {
      await updatePageTitle(pageId, debouncedTitle, workspaceSlug);
      emitTitleUpdate(debouncedTitle);
      router.refresh(); // update this client's own sidebar
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, pageId, workspaceSlug]);

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
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
      />
    </div>
  );
}
