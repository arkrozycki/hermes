import React, { useEffect } from "react";
import { DesktopLayout } from "./DesktopLayout";
import { AuthProvider } from "../../contexts/AuthContext";

function DesktopApp() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        console.log("ESC key pressed");
        // Logic to hide the app
        window.electron?.send("hide-app");
        console.log("hide-app event sent");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <AuthProvider>
      <DesktopLayout>
        <></> {/* Empty fragment as children */}
      </DesktopLayout>
    </AuthProvider>
  );
}

export default DesktopApp;
