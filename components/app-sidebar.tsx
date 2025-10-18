"use client"

import * as React from "react"
import { FileTextIcon, FolderIcon, LayoutDashboardIcon, SettingsIcon, UsersIcon } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: { name: "Utente", email: "", avatar: "" },
  navMain: [
    { title: "Dashboard", url: "/", icon: LayoutDashboardIcon },
    { title: "Commesse", url: "/commesse", icon: FolderIcon },
    { title: "Clienti", url: "/clients", icon: UsersIcon },
    { title: "Fornitori", url: "/suppliers", icon: UsersIcon },
    { title: "Documenti", url: "/documents", icon: FileTextIcon },
    { title: "Impostazioni", url: "/settings?tab=users", icon: SettingsIcon },
  ],
  navSecondary: [],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader />
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
