import "./App.css"; // ✅ Ensures base styles and utility classes are loaded
import { useEffect, useState } from "react";
import { Overlay } from "./Overlay";

export default function App() {
  const [visible, setVisible] = useState(true); // Set to false to hide on launch

  useEffect(() => {
    // Listen for Electron IPC toggle signal
    window.electron?.on("toggle-overlay", () => {
      setVisible((prev) => !prev);
    });
  }, []);

  return (
    <div className="font-sans text-zinc-900 dark:text-zinc-100 text-center mt-5 px-4">
      <Overlay />
    </div>
  );
}
