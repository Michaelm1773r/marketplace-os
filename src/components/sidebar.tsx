"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { initials } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  Shield,
  PlusCircle,
  ClipboardCheck,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    roles: string[];
  };
}

const buyerLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "My Projects", icon: FolderKanban },
  { href: "/dashboard/projects/new", label: "New Project", icon: PlusCircle },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
];

const freelancerLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/tasks", label: "My Tasks", icon: ClipboardCheck },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
];

const adminLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/admin/projects", label: "All Projects", icon: FolderKanban },
  { href: "/dashboard/admin/freelancers", label: "Freelancer Bench", icon: Users },
  { href: "/dashboard/admin/qa", label: "QA Queue", icon: ClipboardCheck },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user.roles?.includes("ADMIN");
  const isFreelancer = user.roles?.includes("FREELANCER");

  const links = isAdmin ? adminLinks : isFreelancer ? freelancerLinks : buyerLinks;

  const nav = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16 border-b">
        <div className="h-8 w-8 rounded-lg bg-blue-900 flex items-center justify-center">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        <span className="font-semibold text-slate-900">Marketplace OS</span>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
          {isAdmin && <><Shield className="h-3.5 w-3.5" /> Operator</>}
          {!isAdmin && isFreelancer && <><ClipboardCheck className="h-3.5 w-3.5" /> Freelancer</>}
          {!isAdmin && !isFreelancer && <><FolderKanban className="h-3.5 w-3.5" /> Buyer</>}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-1">
        {links.map((link) => {
          const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-blue-50 text-blue-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <link.icon className={cn("h-4 w-4", active ? "text-blue-700" : "text-slate-400")} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User + settings */}
      <div className="p-3 border-t">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Settings className="h-4 w-4 text-slate-400" />
          Settings
        </Link>
        <Separator className="my-2" />
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
              {initials(user.name || user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user.name || "User"}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-600"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b h-14 flex items-center px-4">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="ml-3 font-semibold text-slate-900">Marketplace OS</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-40 w-64 bg-white border-r flex flex-col transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {nav}
      </aside>

      {/* Mobile spacer */}
      <div className="lg:hidden h-14" />
    </>
  );
}
