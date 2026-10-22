"use client";

import { useQueryClient } from "@tanstack/react-query";
import { EllipsisVertical, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth/client";

export type NavUserProps = {
  name: string;
  email: string;
  avatarUrl: string;
  initials: string;
};

function UserAvatar({ user }: { user: NavUserProps }) {
  return (
    <Avatar className="size-8 rounded-lg after:rounded-lg">
      <AvatarImage src={user.avatarUrl} alt="" className="rounded-lg" />
      <AvatarFallback className="rounded-lg">{user.initials}</AvatarFallback>
    </Avatar>
  );
}

function UserDetails({ user }: { user: NavUserProps }) {
  return (
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-medium text-foreground">{user.name}</span>
      <span className="truncate text-xs text-foreground/70">{user.email}</span>
    </div>
  );
}

export function NavUser({ user }: { user: NavUserProps }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function signOut() {
    await authClient.signOut();
    queryClient.clear();
    router.replace("/auth/sign-in");
    router.refresh();
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip={user.name}
                className="aria-expanded:bg-sidebar-accent"
              />
            }
          >
            <UserAvatar user={user} />
            <UserDetails user={user} />
            <EllipsisVertical className="ml-auto size-4!" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5">
                  <UserAvatar user={user} />
                  <UserDetails user={user} />
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
