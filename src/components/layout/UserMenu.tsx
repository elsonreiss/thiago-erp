"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { PublicUser } from "@/domain/entities/User";

const ROLE_LABELS: Record<PublicUser["role"], string> = {
  admin: "Administrador",
  gerente: "Gerente",
  funcionario: "Funcionário",
};

export function UserMenu({ user }: { user: PublicUser }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-bg-secondary"
      >
        {user.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photo} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ui-primary text-xs font-semibold text-ui-primary-foreground">
            {initials || <UserIcon size={15} />}
          </div>
        )}
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-[120px] truncate text-sm font-medium text-text-primary">{user.name}</span>
          <span className="block text-[11px] text-text-muted">{ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronDown size={14} className="hidden text-text-muted sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <div className="border-b border-border px-4 py-3 sm:hidden">
            <p className="truncate text-sm font-medium text-text-primary">{user.name}</p>
            <p className="text-xs text-text-muted">{ROLE_LABELS[user.role]}</p>
          </div>
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-secondary"
          >
            <UserIcon size={16} className="text-text-muted" />
            Meu perfil
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger hover:bg-danger-soft disabled:opacity-60"
          >
            <LogOut size={16} />
            {loggingOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      )}
    </div>
  );
}
