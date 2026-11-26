import { S, msg, opPump, opAddBarite, opBop, opSlips } from "./sim";
import { CHAIR, doorState, insideDoghouse, type InteractId } from "./world";
import { player, useGame, input } from "./store";

export function interact(id: InteractId) {
  const ui = useGame.getState();
  switch (id) {
    case "door": doorState.target = doorState.target ? 0 : 1; break;
    case "chair":
      if (!insideDoghouse(player.x, player.z, player.y)) return;
      ui.set({ mode: "seated", prompt: null }); input.keys.clear();
      if (document.pointerLockElement) document.exitPointerLock();
      msg("Posto do Driller: arraste a alavanca vermelha ou use W/S"); break;
    case "pump": opPump(); break;
    case "hopper": opAddBarite(); break;
    case "shaker": msg(S.fout > 5 ? `Retorno ${S.fout.toFixed(0)} gpm · lama ${S.dens.toFixed(2)} ppg${S.influx > 0 ? " · GÁS NO RETORNO!" : " · cascalho normal"}` : "Peneiras paradas: sem retorno de lama"); break;
    case "bop": opBop(); break;
    case "rack": msg(`Rack: ${Math.max(0, 40 - S.stats.conn)} tubos de 9,5 m · ${S.stats.conn} conectados nesta sessão`); break;
    case "rotary": opSlips(); break;
  }
}

export function standUp() {
  useGame.getState().set({ mode: "explore" }); S.lever = 0; input.leverKey = 0;
  player.x = CHAIR.x + 0.2; player.z = CHAIR.z + 1.1; player.heading = Math.PI / 2;
}
