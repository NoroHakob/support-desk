import { House, Inbox, type LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  href: "/dashboard" | "/dashboard/inbox";
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { title: "Home", href: "/dashboard", icon: House },
  { title: "Inbox", href: "/dashboard/inbox", icon: Inbox },
];

export function isNavItemActive(item: NavItem, pathname: string) {
  return item.href === "/dashboard"
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}
