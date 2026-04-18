"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Avatar } from "@/components/shared/Avatar";

export function MentionNodeView({ node }: NodeViewProps) {
  const label: string | null = node.attrs.label ?? null;
  const image: string | null = node.attrs.image ?? null;
  const name = label ?? "Unknown";

  return (
    <NodeViewWrapper
      as="span"
      className="mention inline-flex items-center gap-1 rounded px-1 py-0.5 bg-accent/10 text-accent font-medium text-[0.85em] leading-none align-middle select-none cursor-default"
    >
      <Avatar name={name} image={image} size={14} />
      <span>@{name}</span>
    </NodeViewWrapper>
  );
}
