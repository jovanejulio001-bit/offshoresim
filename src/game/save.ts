import { supabase } from "@/integrations/supabase/client";
import { S, msg } from "./sim";

export async function loadProgress(uid: string) {
  const { data, error } = await supabase.from("progress").select("*").eq("user_id", uid).maybeSingle();
  if (error) return msg("Não foi possível carregar o progresso");
  if (data) {
    S.hole = data.hole; S.bit = Math.min(data.bit, data.hole); S.anchor = S.bit + S.h;
    Object.assign(S.stats, (data.stats as object) ?? {});
    const st = data.settings as { dens?: number } | null;
    if (st?.dens) { S.dens = S.densT = st.dens; }
    msg("Progresso carregado: fundo do poço " + S.hole.toFixed(0) + " m");
  }
}

export async function saveProgress(uid: string, quiet = false) {
  const { error } = await supabase.from("progress").upsert({ user_id: uid, hole: S.hole, bit: S.bit, stats: S.stats, settings: { dens: S.densT }, updated_at: new Date().toISOString() });
  if (!quiet) msg(error ? "Erro ao guardar o progresso" : "Progresso guardado");
  return !error;
}
