import { ReactNode } from "react";
import { DashboardProvider } from "@/src/components/dashboard/DashboardProvider";
import { DashboardShell } from "@/src/components/dashboard/DashboardShell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
