import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGame } from "./store";
import { loadProgress, saveProgress } from "./save";

/** Session tracking + progress load on sign-in + autosave every 60 s and on page hide. */
export function useAccount() {
  useEffect(() => {
    let loadedFor: string | null = null;
    const apply = (u: { id: string; email?: string | null } | null) => {
      useGame.getState().set({ user: u ? { id: u.id, email: u.email ?? "" } : null });
      if (u && loadedFor !== u.id) { loadedFor = u.id; setTimeout(() => void loadProgress(u.id), 0); }
      if (!u) loadedFor = null;
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => apply(session?.user ?? null));
    supabase.auth.getSession().then(({ data }) => apply(data.session?.user ?? null));
    const tick = setInterval(() => { const u = useGame.getState().user; if (u) void saveProgress(u.id, true); }, 60000);
    const hide = () => { const u = useGame.getState().user; if (u) void saveProgress(u.id, true); };
    window.addEventListener("pagehide", hide);
    return () => { sub.subscription.unsubscribe(); clearInterval(tick); window.removeEventListener("pagehide", hide); };
  }, []);
}
