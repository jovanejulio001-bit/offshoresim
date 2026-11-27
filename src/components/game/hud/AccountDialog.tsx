import { useState } from "react";
import { useGame } from "@/game/store";
import { saveProgress } from "@/game/save";

export function AccountDialog() {
  const { account, set } = useGame();
  const [note, setNote] = useState("");
  if (!account) return null;
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-background/60 backdrop-blur-sm" onPointerDown={(e) => e.target === e.currentTarget && set({ account: false })}>
      <div className="hud-panel w-[min(400px,92vw)] p-6">
        <div className="flex items-center justify-between"><h3 className="font-hud text-xl font-bold">Progresso</h3><button onClick={() => set({ account: false })} className="text-sm text-muted-foreground hover:text-foreground">Fechar</button></div>
        <div className="mt-4 grid gap-2 text-sm">
          <p className="text-muted-foreground">O progresso fica guardado neste navegador, automaticamente a cada 60 s.</p>
          <button onClick={() => setNote(saveProgress() ? "Guardado" : "Erro ao guardar")} className="rounded-sm bg-primary px-4 py-2.5 font-hud text-sm font-bold uppercase text-primary-foreground">Guardar progresso agora</button>
        </div>
        {note && <p className="mt-3 text-xs text-accent">{note}</p>}
      </div>
    </div>
  );
}
