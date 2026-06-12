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
          <SidebarGroupLabel className="text-zinc-500">Active Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/orders" className="text-white w-full h-full">
                  <SidebarMenuButton isActive={pathname === '/orders'}>
                    <ShoppingBag />
                    <span>All Orders</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/payments" className="text-white w-full h-full">
                  <SidebarMenuButton isActive={pathname === '/payments'}>
                    <Settings />
                    <span>Payments</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/production-queue" className="text-white w-full h-full">
                  <SidebarMenuButton isActive={pathname === '/production-queue'}>
                    <Box />
                    <span>Master Ji Queue</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/quick-order" className="text-white w-full h-full">
                  <SidebarMenuButton isActive={pathname === '/quick-order'}>
                    <LayoutDashboard />
                    <span>Quick Links & Booking</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
