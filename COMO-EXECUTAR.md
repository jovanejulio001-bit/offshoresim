# Offshore Sim — como executar o código

Este é o código-fonte do simulador de perfuração 3D em terceira pessoa.

## Requisitos

- Node.js 20 ou mais recente (com o gestor de pacotes `bun`, recomendado)
- npm, se preferir não usar `bun`

## Instalar e arrancar

```sh
bun install     # ou: npm install
bun run dev     # ou: npm run dev
```

Depois abra <http://localhost:8080> no navegador.

Outros comandos úteis:

```sh
bun run build        # compilar para produção
bun run test         # correr os testes da lógica de perfuração
bun run typecheck    # verificar os tipos TypeScript
```

## Contas e progresso guardado

O jogo guarda contas e o progresso de cada jogador no Lovable Cloud (a base de
dados que já vem com este projeto). Para isso funcionar fora do Lovable, precisa
de um ficheiro `.env` na raiz do projeto com estas variáveis:

```
VITE_SUPABASE_URL=https://<o-seu-projeto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<a sua chave pública>
SUPABASE_URL=https://<o-seu-projeto>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<a sua chave pública>
```

A estrutura da base de dados está em `drizzle/migrations/0000_create_progress.sql`
(a tabela `progress`, com as regras de acesso de cada utilizador).

## Onde está o quê

- `src/game/sim.ts` — todas as regras de perfuração (bombas, rotação,Top Drive,
  cunhas, conexões, kick, BOP, LOT, densidade da lama)
- `src/game/world.ts` — desenho da plataforma: alturas, escadas, colisão,
  objetos com que se pode interagir
- `src/components/game/` — o mundo 3D, os trabalhadores, o jogador e a consola
  do Driller
- `src/components/game/hud/` — painel de estado, joystick e botões de toque
- `src/test/sim.test.ts` — testes das regras principais
