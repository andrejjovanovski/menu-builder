"use client";

import { ThemeProvider } from "@/src/components/theme-provider";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
