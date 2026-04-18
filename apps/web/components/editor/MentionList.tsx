"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Avatar } from "@/components/shared/Avatar";

export interface MentionMember {
  id: string;
  name: string;
  image: string | null;
}

interface Props {
  items: MentionMember[];
  command: (item: { id: string; label: string; image: string | null }) => void;
}

export interface MentionListHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export const MentionList = forwardRef<MentionListHandle, Props>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => setSelectedIndex(0), [items]);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) command({ id: item.id, label: item.name, image: item.image });
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i + items.length - 1) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="z-50 rounded-lg border border-border bg-bg-surface shadow-lg w-48 px-3 py-2 text-xs text-text-faint">
          No members found
        </div>
      );
    }

    return (
      <div className="z-50 rounded-lg border border-border bg-bg-surface shadow-lg overflow-hidden w-56 py-1">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault(); // keep editor focus
              selectItem(index);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
              index === selectedIndex
                ? "bg-accent/10 text-accent"
                : "text-text hover:bg-bg-hover"
            }`}
          >
            <Avatar name={item.name} image={item.image} size={22} />
            <span className="truncate">{item.name}</span>
          </button>
        ))}
      </div>
    );
  }
);

MentionList.displayName = "MentionList";
