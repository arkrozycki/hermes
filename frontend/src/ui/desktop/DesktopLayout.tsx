import React, { ReactNode } from "react";
import { Overlay } from "./Overlay";

export function DesktopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="font-sans text-zinc-900 dark:text-zinc-100">
      {children}
      <Overlay /> {/* stays globally mounted */}
    </div>
  );
}