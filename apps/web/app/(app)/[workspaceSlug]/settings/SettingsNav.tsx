"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Users } from "lucide-react";

export function SettingsNav({ workspaceSlug }: { workspaceSlug: string }) {
  const pathname = usePathname();

  const tabs = [
    {
      href: `/${workspaceSlug}/settings`,
      label: "General",
      icon: Settings,
      exact: true,
    },
    {
      href: `/${workspaceSlug}/settings/members`,
      label: "Members",
      icon: Users,
      exact: false,
    },
  ];

  return (
    <nav className="flex gap-1 -mb-px">
      {tabs.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-colors ${
              isActive
                ? "border-accent text-text font-medium"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
