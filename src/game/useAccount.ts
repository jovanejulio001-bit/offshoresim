import { useEffect } from "react";
import { loadProgress, saveProgress } from "./save";

/** Loads local progress once, autosaves every 60 s and on page hide. */
export function useAccount() {
  useEffect(() => {
    loadProgress();
    const tick = setInterval(() => saveProgress(true), 60000);
    const hide = () => saveProgress(true);
    window.addEventListener("pagehide", hide);
    return () => { clearInterval(tick); window.removeEventListener("pagehide", hide); };
  }, []);
}
