# OffshoreSim — Third-Person Offshore Drilling Game

Projecto web 3D baseado no código original, com Three.js, JavaScript e Supabase opcional. A atualização mantém a aplicação de página única e os módulos de simulação existentes, reforçando o ambiente explorável e a experiência de jogo em terceira pessoa.

## Melhorias desta versão

- Câmara de terceira pessoa com seguimento amortecido, rotação independente, inclinação e zoom.
- Movimento com aceleração/desaceleração, transição de marcha, corrida e animação procedural do personagem.
- Controlos desktop (WASD, Shift, rato, roda do rato, E e Esc) e controlos tácteis (joystick, botão RUN e botão E).
- HUD de jogo com objetivo/contexto, indicador operacional e interface adaptável a telemóveis.
- Plataforma ampliada com contentores industriais, módulo de geradores, manifold, passadiços, corrimãos, escadas e mais elementos de convés.
- Doghouse com cadeira, consola, monitores que apresentam telemetria simulada, manómetros e representação 3D da alavanca do Top Drive.
- Alavanca de operação no painel continua ligada diretamente ao motor de simulação: positivo sobe, negativo desce e neutro pára. A posição do Top Drive, bloco, coluna e broca continua sincronizada com o estado S.
- Bombas, rotação, circulação, níveis dos tanques, trabalhadores, alarmes, LOT, kick e BOP continuam ligados ao motor de simulação existente.
- Qualidade gráfica configurável e redução automática de resolução em dispositivos móveis/de menor memória.
- Autenticação e gravação Supabase preservadas.

## Publicar na Vercel — corrigir o ecrã só com texto

Este ZIP contém `index.html`, `css/`, `js/` e `vercel.json` diretamente na raiz.
Não publique apenas o `index.html`: os outros ficheiros são necessários.

1. Extraia este ZIP.
2. No repositório ligado à Vercel, coloque todo o conteúdo extraído na pasta
   usada como raiz do projeto, mantendo as pastas `css` e `js`.
3. Na Vercel, abra o projeto → Settings → Build and Deployment.
4. Em Root Directory, selecione a pasta que contém `index.html` e `vercel.json`;
   se estiverem na raiz do repositório, deixe Root Directory vazio.
5. Framework Preset: Other. Desative quaisquer substituições antigas de
   Build Command e Output Directory; o ficheiro `vercel.json` define esta versão
   como um site estático, sem compilação, com saída na própria raiz.
6. Remova configurações antigas que enviem todos os pedidos para `index.html`.
   Publique novamente e abra o site.

Para confirmar: `/css/style.css` deve mostrar CSS e `/js/game.js` deve mostrar
JavaScript — nunca a página HTML. O erro observado no site publicado era este:
ambos os tipos de ficheiro devolviam HTML, impedindo o jogo de iniciar.

O Supabase não causa esse erro de carregamento. Esta cópia contém configuração
exemplificativa: contas e gravação continuam dependentes da configuração pública
correta de um projeto existente. Não foram importados utilizadores ou dados,
nem testado o início de sessão. Nunca publique chaves privadas.

## Executar localmente

1. Extraia o ZIP.
2. Abra a pasta num servidor estático (por exemplo, `npx serve offshoresim-main`).
3. Aceda ao endereço local indicado pelo servidor.
4. O navegador precisa de internet para carregar Three.js e Supabase através de CDN.

Também pode publicar o conteúdo da pasta `offshoresim-main` na Vercel, Netlify ou GitHub Pages.

## Controlos

### PC
- `W A S D` ou setas: mover.
- `Shift`: correr.
- Arrastar com o rato sobre o mundo: rodar a câmara.
- Roda do rato: aproximar/afastar.
- `E`: interagir com portas, painel e áreas operacionais.
- `Esc`: fechar o painel de operação.

### Telemóvel
- Joystick esquerdo: movimentar personagem.
- Arrastar no lado direito/livre do cenário: rodar a câmara.
- `RUN`: correr enquanto estiver pressionado.
- `E`: interagir.

### Operação de perfuração

No painel do Driller, arraste a alavanca vertical para cima para elevar o Top Drive e para baixo para o baixar. Ao largar, a alavanca regressa ao neutro. Bombas, rotação, cunhas, elevadores, conexão de tubos, densidade, BOP, kick e LOT mantêm os interlocks e relações do motor de simulação.

## Supabase (opcional)

1. Crie um projecto Supabase.
2. Execute `supabase.sql` no SQL Editor.
3. Preencha `js/config.js` com a URL do projecto e a chave pública `anon`.

Nunca coloque a chave `service_role` no navegador.

## Limites técnicos honestos

Esta é uma evolução do protótipo original, não um jogo AAA nem uma reprodução do GTA San Andreas. O cenário e personagens continuam construídos proceduralmente com geometrias Three.js; as animações são procedurais e não usam motion capture nem rigs profissionais. Para fidelidade de produção, será necessário acrescentar modelos 3D PBR/GLTF, animações esqueléticas, áudio, testes de colisão extensivos e profiling em dispositivos reais.

Os parâmetros de perfuração são simplificados para fins educativos e de entretenimento. Não utilizar para decisões operacionais reais, controlo de poços, dimensionamento de equipamento ou formação certificada.
