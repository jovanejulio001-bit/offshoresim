import { useGame } from "@/game/store";
import { S } from "@/game/sim";

export function PauseMenu() {
  const { paused, set, quality, user } = useGame();
  if (!paused) return null;
  return (
    <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
      <div className="hud-panel w-[min(420px,92vw)] p-6">
        <div className="font-hud text-xs font-bold tracking-[0.3em] text-primary">OFFSHORE DRILLING SIM</div>
        <h2 className="mt-1 font-hud text-3xl font-bold">Pausa</h2>
        <div className="mt-5 grid gap-2">
          <button onClick={() => set({ paused: false })} className="rounded-sm bg-primary px-4 py-3 font-hud text-sm font-bold uppercase tracking-wider text-primary-foreground">Continuar</button>
          <button onClick={() => set({ account: true })} className="rounded-sm border border-border bg-secondary px-4 py-3 font-hud text-sm font-bold uppercase tracking-wider">Progresso</button>
          <button onClick={() => set({ quality: quality === "high" ? "low" : "high" })} className="rounded-sm border border-border bg-secondary px-4 py-3 font-hud text-sm font-bold uppercase tracking-wider">Gráficos: {quality === "high" ? "Alta qualidade" : "Desempenho"}</button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Metros perfurados</span><b className="text-right text-foreground">{S.stats.drilled.toFixed(1)} m</b>
          <span>Tubos conectados</span><b className="text-right text-foreground">{S.stats.conn}</b>
          <span>Kicks controlados</span><b className="text-right text-foreground">{S.stats.kicks}</b>
        </div>
        <details className="mt-4 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-semibold text-foreground">Sequência de perfuração</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>Entre na Doghouse, sente-se na cadeira (E). Bombas ON (SPM ≥ 20) → Rotação ON.</li>
            <li>Alavanca para baixo até a broca tocar o fundo (WOB sobe). ROP depende de WOB × RPM.</li>
            <li>Top Drive em baixo: Cunhas → Abrir elevadores → Conectar tubo → subir Top Drive → soltar cunhas.</li>
            <li>Kick: alarmes → fechar BOP → subir densidade (ou barite no funil) → abrir BOP e circular.</li>
            <li>LOT: parar bombas, Iniciar LOT, premir “Bombear” até ao leak-off, Registar.</li>
          </ol>
        </details>
      </div>
    </div>
  );
}
