"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, ReactRenderer, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { FormattingToolbar } from "./FormattingToolbar";
import { MentionList, MentionMember, MentionListHandle } from "./MentionList";
import { MentionNodeView } from "./MentionNodeView";

interface CollaborativeEditorProps {
  pageId: string;
  userName: string;
  userColor: string;
  members?: MentionMember[];
}

export { getUserColor } from "@/lib/utils";
export type { MentionMember };

function buildSuggestion(members: MentionMember[]) {
  return {
    items: ({ query }: { query: string }) =>
      members
        .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8),

    render: () => {
      let component: ReactRenderer<MentionListHandle> | null = null;
      let container: HTMLDivElement | null = null;

      const updatePosition = (clientRectFn: (() => DOMRect | null) | null) => {
        if (!clientRectFn || !container) return;
        const rect = clientRectFn();
        if (!rect) return;
        container.style.top = `${rect.bottom + window.scrollY + 6}px`;
        container.style.left = `${rect.left + window.scrollX}px`;
      };

      return {
        onStart(props: any) {
          container = document.createElement("div");
          container.style.position = "absolute";
          container.style.zIndex = "9999";
          document.body.appendChild(container);

          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });
          container.appendChild(component.element);
          updatePosition(props.clientRect ?? null);
        },
        onUpdate(props: any) {
          component?.updateProps(props);
          updatePosition(props.clientRect ?? null);
        },
        onKeyDown(props: { event: KeyboardEvent }) {
          if (props.event.key === "Escape") {
            container?.remove();
            component?.destroy();
            container = null;
            component = null;
            return true;
          }
          return component?.ref?.onKeyDown(props.event) ?? false;
        },
        onExit() {
          component?.destroy();
          container?.remove();
          component = null;
          container = null;
        },
      };
    },
  };
}

function EditorInner({
  ydoc,
  connected,
  members,
}: {
  ydoc: Y.Doc;
  connected: boolean;
  members: MentionMember[];
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ undoRedo: false }),
      Collaboration.configure({ document: ydoc }),
      Placeholder.configure({
        placeholder: "Start writing… type @ to mention someone",
      }),
      Mention.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            image: {
              default: null,
              parseHTML: (el) => el.getAttribute("data-image"),
              renderHTML: (attrs) =>
                attrs.image ? { "data-image": attrs.image } : {},
            },
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(MentionNodeView);
        },
      }).configure({
        suggestion: buildSuggestion(members),
      }),
    ],
    editorProps: {
      attributes: { class: "focus:outline-none min-h-[300px] prose-custom" },
    },
    immediatelyRender: false,
  });

  return (
    <div>
      {/* Formatting toolbar */}
      <FormattingToolbar editor={editor} />

      {/* Live status dot */}
      <div className="relative">
        <div
          title={connected ? "Live — changes sync in real time" : "Connecting…"}
          className={`absolute -top-0 right-0 flex items-center gap-1.5 text-xs transition-colors ${
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
    </div>
  );
}

export function CollaborativeEditor({
  pageId,
  members = [],
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
    return <div className="min-h-[300px]" />;
  }

  return (
    <EditorInner
      ydoc={ydocRef.current}
      connected={connected}
      members={members}
    />
  );
}
