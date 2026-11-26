<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Offshore simulator architecture
- Drilling rules live in `src/game/sim.ts` (plain TS, single mutable `S`); UI and 3D only read/write `S` — keeps logic testable (`src/test/sim.test.ts`).
- World layout, colliders, stairs/floor heights and interactables live in `src/game/world.ts`; steps > `MAX_STEP` act as walls/railings so no extra rail colliders are needed.
- One stepper: `PlayerRig` useFrame runs sim → player → interactions → camera; never call React setters per frame (HUD polls with `useTick`).
- Characters are procedural (`Character.tsx`) because CC0 rigged-model sources were unreachable from the sandbox; swap in a CC0 GLB later if one can be fetched.
- Dev-only hooks: `window.__game` ({S, player, input, ui, interact}) and `window.__cam` for scripted browser checks.
- Player progress is the `progress` table (one row per user, RLS own-row); autosave every 60 s and on page hide.
