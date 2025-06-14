import { ReactNode } from "react";

export function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="font-sans text-zinc-900 dark:text-zinc-100">
      {/* Mobile-specific components or layout */}
      {children}
    </div>
  );
}