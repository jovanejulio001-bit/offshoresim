# Offshore Drilling Simulator – versão visual melhorada

Protótipo web 3D single-player com Three.js, JavaScript e Supabase opcional. A simulação decorre localmente no dispositivo do jogador; o Supabase é utilizado apenas para autenticação e gravação do progresso, quando configurado.

## Melhorias incluídas nesta versão

- HUD e controlos redesenhados com inspiração na organização visual de jogos mobile de terceira pessoa (sem copiar recursos ou identidade de Free Fire).
- Seletor funcional de qualidade gráfica: Alto, Médio e Leve. Em telemóveis/dispositivos com pouca memória, inicia em Médio.
- Melhor iluminação, tone mapping, sombras, nevoeiro atmosférico, horizonte e superfície do mar.
- Mastro com contraventamentos diagonais, tubagens, guarda-corpos, projectores, marcações de segurança e guindaste de apoio.
- Doghouse com consola, monitores e cadeira.
- Trip tank visível e níveis separados para tanques ativos, armazenamento e trip tank.
- Painel operacional reorganizado, com parâmetros, pressões, fluxos, profundidades, níveis de tanques, gráficos, secção do poço e LOT.
- Câmara de terceira pessoa com seguimento mais suave.

## Executar

Abra a pasta através de um servidor local (por exemplo, `npx serve`) ou publique a pasta no Vercel, Netlify ou GitHub Pages. O navegador precisa de acesso à internet para carregar Three.js e a biblioteca Supabase através de CDN.

## Supabase (opcional)

1. Crie um projeto Supabase gratuito.
2. Execute `supabase.sql` no SQL Editor.
3. Preencha `js/config.js` com a URL do projeto e a chave `anon`.

Não coloque a `service_role` key no navegador.

## Controlos

- WASD / joystick: mover.
- Shift: correr.
- Arrastar no ecrã / rato: rodar a câmara.
- Roda do rato: zoom.
- E: interagir com porta, painel e áreas de inspeção.
- No painel do Driller: arrastar a alavanca física para cima/baixo para mover o Top Drive; largar para voltar ao neutro.

## Nota importante sobre os gráficos

Esta atualização melhora o código, a iluminação, o HUD e os detalhes construídos proceduralmente. Para atingir fidelidade visual comparável a um jogo comercial como Free Fire, ainda serão necessários modelos 3D profissionais, texturas PBR, rigs/animations de personagens, otimização por dispositivo e testes em telemóveis reais. O protótipo não deve ser apresentado como tendo já esse nível comercial.

## Limitações de simulação

Os parâmetros são didáticos e simplificados para gameplay. Não utilizar para decisões operacionais reais, formação certificada ou controlo de poços em instalações reais.
