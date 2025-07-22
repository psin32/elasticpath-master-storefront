"use client";

import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
  content?: any;
}

export function AdminLayout({ content, children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        content={content}
      />
      <div className="lg:pl-72">
        <AdminHeader setSidebarOpen={setSidebarOpen} />
        <main className="overflow-auto">{children}</main>
      </div>
    </>
  );
}
