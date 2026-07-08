"use client";

import { useEffect, useState } from "react";
import { PublicUser } from "@/domain/entities/User";
import { navItemsForRole } from "@/lib/nav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const COLLAPSE_KEY = "thiago-sidebar-collapsed";

export function AppShell({ user, children }: { user: PublicUser; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Sincroniza com localStorage uma única vez, no mount — não é um efeito
    // reagindo a props/state do React, então o setState aqui é intencional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const items = navItemsForRole(user.role);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        items={items}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`flex min-h-screen flex-col transition-all duration-200 ${collapsed ? "md:pl-[76px]" : "md:pl-64"}`}>
        <Topbar user={user} onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
