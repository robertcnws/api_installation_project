"use client";

import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOut } from "@/actions/auth";

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  const initials = user.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="h-16 border-b flex items-center justify-between px-6 bg-background">
      <div />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-medium">{user.email}</div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form action={signOut}>
              <button type="submit" className="w-full text-left cursor-pointer">
                Sign out
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
