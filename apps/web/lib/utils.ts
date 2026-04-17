import { nanoid } from "./nanoid";

export function generateId() {
  return nanoid();
}

const USER_COLORS = [
  "#5B7FFF", "#FF5F5F", "#5EFF8C", "#FFB454",
  "#C084FC", "#22D3EE", "#FB923C", "#F472B6",
];

export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
