"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, X } from "lucide-react";
import { NavItem } from "@/lib/nav";
import { Logo } from "@/components/layout/Logo";

interface SidebarProps {
  items: NavItem[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ items, collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar-bg text-sidebar-text transition-all duration-200 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          ${collapsed ? "md:w-[76px]" : "md:w-64"} w-64`}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent p-1.5 text-accent-foreground">
              <Logo className="h-full w-full" />
            </div>
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <p className="truncate font-display text-sm font-semibold text-white">Thiago</p>
                <p className="truncate text-[11px] text-sidebar-text-muted">Casa &amp; Construção</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-md p-1 text-sidebar-text-muted hover:bg-sidebar-active-bg hover:text-white md:hidden"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                      ${
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-sidebar-text hover:bg-sidebar-active-bg hover:text-white"
                      }
                      ${collapsed ? "md:justify-center" : ""}`}
                  >
                    <Icon size={19} className="shrink-0" />
                    <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden border-t border-sidebar-border p-3 md:block">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sidebar-text-muted transition-colors hover:bg-sidebar-active-bg hover:text-white"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
}
