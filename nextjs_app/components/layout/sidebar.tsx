"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Wrench,
  Ruler,
  Users,
  Calendar,
  BarChart3,
  Layers,
  UserCheck,
  HardHat,
  ShoppingCart,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/services", label: "Services", icon: Wrench },
  { href: "/measurements", label: "Measurements", icon: Ruler },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/users", label: "Users", icon: Users },
  { href: "/user-roles", label: "User Roles", icon: UserCheck },
  { href: "/stages", label: "Stages", icon: Layers },
  { href: "/installation-crews", label: "Install. Crews", icon: HardHat },
  { href: "/sales-orders", label: "Sales Orders", icon: ShoppingCart },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <span className="font-bold text-lg text-sidebar-foreground">InstallPro</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
