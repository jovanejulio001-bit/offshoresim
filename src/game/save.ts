import { S, msg } from "./sim";

const KEY = "offshore-progress-v1";

/** Progress is kept in this browser (localStorage). */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as { hole: number; bit: number; stats?: object; dens?: number };
    S.hole = data.hole; S.bit = Math.min(data.bit, data.hole); S.anchor = S.bit + S.h;
    Object.assign(S.stats, data.stats ?? {});
    if (data.dens) { S.dens = S.densT = data.dens; }
    msg("Progresso carregado: fundo do poço " + S.hole.toFixed(0) + " m");
  } catch { msg("Não foi possível carregar o progresso"); }
}

export function saveProgress(quiet = false) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ hole: S.hole, bit: S.bit, stats: S.stats, dens: S.densT }));
    if (!quiet) msg("Progresso guardado");
    return true;
  } catch { if (!quiet) msg("Erro ao guardar o progresso"); return false; }
}
