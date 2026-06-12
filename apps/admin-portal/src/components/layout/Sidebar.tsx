"use client";
import { Paintbrush, LayoutDashboard, Settings, Box, Users, ShoppingBag } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-white/10 bg-zinc-950/50">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-white/10">
        <span className="font-semibold text-lg tracking-widest text-white">DEEPRASTORE</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-zinc-500">Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/theme" className="text-white w-full h-full">
                  <SidebarMenuButton isActive={pathname === '/theme'}>
                    <Paintbrush />
                    <span>Theme Editor</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-zinc-500">Operations (Locked)</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton disabled className="opacity-50">
                  <ShoppingBag />
                  <span>Orders</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled className="opacity-50">
                  <Box />
                  <span>Inventory</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled className="opacity-50">
                  <Users />
                  <span>CRM</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
