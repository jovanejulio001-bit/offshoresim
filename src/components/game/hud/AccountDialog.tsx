import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { useGame } from "@/game/store";
import { saveProgress } from "@/game/save";

const G = () => (
  <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
);

export function AccountDialog() {
  const { account, set, user } = useGame();
  const [email, setEmail] = useState(""), [pw, setPw] = useState(""), [note, setNote] = useState(""), [busy, setBusy] = useState(false);
  if (!account) return null;
  const run = async (up: boolean) => {
    setBusy(true); setNote("");
    const res = up ? await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin } }) : await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (res.error) return setNote(res.error.message);
    setNote(res.data.session ? "Sessão iniciada" : "Verifique o seu email para confirmar a conta");
  };
  const oauth = async (p: "google" | "lovable") => { const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin }); if (r.error) setNote("Não foi possível entrar"); };
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-background/60 backdrop-blur-sm" onPointerDown={(e) => e.target === e.currentTarget && set({ account: false })}>
      <div className="hud-panel w-[min(400px,92vw)] p-6">
        <div className="flex items-center justify-between"><h3 className="font-hud text-xl font-bold">Conta</h3><button onClick={() => set({ account: false })} className="text-sm text-muted-foreground hover:text-foreground">Fechar</button></div>
        {user ? (
          <div className="mt-4 grid gap-2 text-sm">
            <p className="text-muted-foreground">Sessão iniciada como <b className="text-foreground">{user.email}</b>. O progresso é guardado automaticamente a cada 60 s.</p>
            <button onClick={async () => setNote((await saveProgress(user.id)) ? "Guardado" : "Erro ao guardar")} className="rounded-sm bg-primary px-4 py-2.5 font-hud text-sm font-bold uppercase text-primary-foreground">Guardar progresso agora</button>
            <button onClick={async () => { await saveProgress(user.id, true); await supabase.auth.signOut(); setNote("Sessão terminada"); }} className="rounded-sm border border-border px-4 py-2.5 font-hud text-sm font-bold uppercase">Sair</button>
          </div>
        ) : (
          <div className="mt-4 grid gap-2">
            <button onClick={() => oauth("google")} className="flex h-10 items-center justify-center gap-[10px] rounded-sm border border-[#8E918F] bg-[#131314] px-3 text-sm font-medium text-[#E3E3E3]"><G />Continue with Google</button>
            <button onClick={() => oauth("lovable")} className="flex h-10 items-center justify-center gap-2 rounded-sm border border-border bg-secondary px-3 text-sm font-medium"><LovableMark className="h-[18px] w-[18px]" />Continue with Lovable</button>
            <div className="my-1 text-center text-xs text-muted-foreground">ou com email</div>
            <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-sm border border-input bg-background/70 px-3 py-2 text-sm" />
            <input type="password" placeholder="palavra-passe" value={pw} onChange={(e) => setPw(e.target.value)} className="rounded-sm border border-input bg-background/70 px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <button disabled={busy} onClick={() => run(false)} className="rounded-sm bg-primary px-3 py-2.5 font-hud text-sm font-bold uppercase text-primary-foreground disabled:opacity-60">Entrar</button>
              <button disabled={busy} onClick={() => run(true)} className="rounded-sm border border-border px-3 py-2.5 font-hud text-sm font-bold uppercase disabled:opacity-60">Criar conta</button>
            </div>
          </div>
        )}
        {note && <p className="mt-3 text-xs text-accent">{note}</p>}
      </div>
    </div>
  );
}
