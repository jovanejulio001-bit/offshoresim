import { useEffect, useState } from "react";
/** Re-render a HUD component at a fixed rate (sim state lives outside React). */
export function useTick(ms = 100) {
  const [, set] = useState(0);
  useEffect(() => { const id = setInterval(() => set((n) => n + 1), ms); return () => clearInterval(id); }, [ms]);
}
