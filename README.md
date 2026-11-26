# Simulador de Perfuração Offshore (protótipo jogável)
Site estático: Three.js + JavaScript puro + Supabase opcional. A simulação corre no dispositivo; só o progresso (a cada 60 s) vai ao Supabase.

## Correr
Abra `index.html` por um servidor local (ex.: `npx serve`) ou publique a pasta no Vercel, Netlify ou GitHub Pages (grátis). Precisa de internet para carregar o Three.js e o Supabase (CDN).

## Supabase
1. Crie o projeto gratuito e execute `supabase.sql`.
2. Edite `js/config.js` com a URL e a chave anon.

## Controlos
WASD/joystick mover, Shift correr, arrastar = câmara, E interagir (porta, painel, inspeção). Dentro da Doghouse (porta aberta), E no painel.

## Sequência de perfuração
1. Bombas ON (SPM ≥ 20) → Rotação ON.
2. Alavanca para baixo até a broca tocar o fundo (WOB sobe); a ROP depende de WOB × RPM.
3. Com o Top Drive em baixo: Cunhas → Abrir elevadores → Conectar tubo → subir Top Drive → soltar cunhas.
4. Kick: "Simular kick" → alarmes → fechar BOP → subir densidade → abrir BOP e circular.
5. LOT: parar bombas, Iniciar LOT, premir "Bombear" até ao leak-off, Registar.

Nota: o tempo de perfuração está acelerado 15x para jogabilidade.
