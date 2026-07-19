"use client";

import React from "react";
import { AuthGuard } from "@/guards/AuthGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
}

export default function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
