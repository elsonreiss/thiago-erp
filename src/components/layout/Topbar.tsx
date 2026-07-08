"use client";

import { Menu } from "lucide-react";
import { PublicUser } from "@/domain/entities/User";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";

export function Topbar({ user, onOpenMobileMenu }: { user: PublicUser; onOpenMobileMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-bg-secondary md:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={19} />
      </button>

      <div className="flex-1">
        <GlobalSearch />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
