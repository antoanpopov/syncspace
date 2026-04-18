"use client";

import { useEffect, useRef } from "react";

const EMOJIS = [
  // Documents
  "📄","📝","📋","📌","📍","📁","📂","🗂",
  // Notebooks
  "📓","📔","📒","📕","📗","📘","📙","🗒",
  // Charts & time
  "📊","📈","📉","🗓","📅","📆","🔎","💡",
  // Tech
  "💻","🖥","📱","💾","🔌","🔋","🌐","🔗",
  // Tools
  "🔧","⚙","🛠","🔐","📧","📢","🧩","🎨",
  // Status
  "✅","❌","⚠️","🔥","⚡","🎯","🏆","⭐",
  // Misc
  "🚀","💬","👥","🎉","💰","📦","🌱","🧪",
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 mt-1 rounded-xl border border-border bg-bg-surface shadow-2xl p-2"
      style={{ width: 264 }}
    >
      <div className="grid grid-cols-8 gap-0.5">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => { onSelect(emoji); onClose(); }}
            className="h-7 w-7 flex items-center justify-center rounded text-base hover:bg-bg-hover transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
