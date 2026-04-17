"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

interface CollaborativeEditorProps {
  pageId: string;
  userName: string;
  userColor: string;
}

export { getUserColor } from "@/lib/utils";

function EditorInner({
  ydoc,
  connected,
}: {
  ydoc: Y.Doc;
  connected: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ undoRedo: false }),
      Collaboration.configure({ document: ydoc }),
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    editorProps: {
      attributes: { class: "focus:outline-none min-h-[200px]" },
    },
    immediatelyRender: false,
  });

  return (
    <div className="relative">
      <div
        title={connected ? "Live — changes sync in real time" : "Connecting…"}
        className={`absolute -top-6 right-0 flex items-center gap-1.5 text-xs transition-colors ${
          connected ? "text-success" : "text-text-faint"
        }`}
      >
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full transition-colors ${
            connected ? "bg-success" : "bg-text-faint animate-pulse"
          }`}
        />
        {connected ? "Live" : "Connecting…"}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

export function CollaborativeEditor({
  pageId,
}: CollaborativeEditorProps) {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: process.env.NEXT_PUBLIC_HOCUSPOCUS_URL ?? "ws://localhost:3002",
      name: pageId,
      document: ydoc,
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
    });

    ydocRef.current = ydoc;
    providerRef.current = provider;
    setReady(true);

    return () => {
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
      setReady(false);
    };
  }, [pageId]);

  if (!ready || !ydocRef.current) {
    return <div className="min-h-[200px]" />;
  }

  return (
    <EditorInner
      ydoc={ydocRef.current}
      connected={connected}
    />
  );
}
