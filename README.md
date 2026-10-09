# Vale da Candeia — Raízes do Vale

RPG 2D de vida no campo para navegador, em TypeScript, com motor próprio em Canvas. Toda a arte (tiles, personagens, retratos, ícones, prédios, monstros) e todo o áudio (efeitos, ambiência e trilha) são gerados por código: não há nenhum asset externo.

## Rodar

```bash
bun build src/main.ts --outdir dist --target browser --minify
node tools/inline.mjs          # gera dist/vale-candeia.html (arquivo único)
python3 -m http.server 8000 --directory dist   # abra http://localhost:8000/vale-candeia.html
```

`tsc --noEmit -p .` faz a checagem de tipos. Qualquer bundler de TS funciona (Vite/esbuild) apontando para `src/main.ts`.

## Controles

| Ação | Tecla |
|---|---|
| Mover | WASD / setas |
| Usar ferramenta/item (segure para carregar enxada e regador melhorados) | Clique esquerdo / Espaço |
| Interagir, conversar, colher, presentear | Clique direito / E |
| Barra rápida | 1–9, 0, -, = / roda do mouse |
| Inventário · Fabricar · Missões · Mapa · Menu | Tab · C · J · M · Esc |
| Ocultar HUD | H |

## Estrutura

```
src/
  core/      util, input, contexto global
  art/       pintor de pixel art, tiles por estação, personagens/retratos, ícones, objetos/prédios/animais/monstros
  data/      itens, cultivos (32), peixes (34), NPCs (22), receitas, lojas, máquinas, armas, monstros, Casa dos Ofícios, festivais, cartas, missões
  world/     tipos, DSL de mapas, todos os mapas, gerador procedural das minas, runtime de mapa
  state/     estado salvo, novo jogo, save (IndexedDB + backup + fallback localStorage)
  systems/   jogador, ações/ferramentas, agricultura, pesca, combate/mineração, máquinas/fabricação, NPCs (rotinas e rotas entre mapas), animais, missões/cartas, festivais, habilidades, dia/noite
  render/    renderizador (ordenação por profundidade, clima, iluminação), partículas
  ui/        HUD, diálogos, menus, lojas, título e criação de personagem (DOM rústico)
  audio/     síntese de efeitos, ambiência e música procedural por estação/local
```

Tudo é data-driven: novos cultivos, peixes, moradores, receitas, máquinas ou lojas entram editando `src/data/*`.

## Conteúdo

- Mundo: fazenda, Vila Candeia (~25 estruturas), Floresta dos Ipês, Praia do Farol, Serra do Candeeiro, Minas (80 andares em 4 biomas), Enseada Esquecida (região secreta) e 20 interiores.
- 4 estações de 28 dias, clima (sol, chuva, tempestade, neve, vento) que afeta plantações, peixes, iluminação, sons e rotinas.
- 22 moradores com rotina por horário/dia/clima, gostos, aniversários, eventos de coração, namoro e casamento.
- Ferramentas em 5 níveis, 5 habilidades com especializações, 34 receitas de fabricação, 14 de cozinha, 9 máquinas de processamento, automação (aspersores, funil de feno, coletor).
- Animais (galinha, pato, vaca, cabra, ovelha), construções (galinheiro, celeiro, silo, poço, estábulo com cavalo), reformas da casa e decoração.
- Casa dos Ofícios: 6 altares que desbloqueiam estufa, ponte para a enseada, carrinho de mina, loja da Selma, receitas de automação e o comerciante itinerante.
- 8 festivais com minijogos, mural de pedidos, missões de história, caça e exploração.

## Nota técnica

O registro do npm estava bloqueado no ambiente de desenvolvimento, por isso não foi usado Phaser. O motor próprio cobre câmera, tilemap com culling, colisão, ordenação por profundidade, partículas e iluminação, e roda a 60 FPS. A arquitetura separa estado, dados, sistemas e renderização, o que facilita trocar o renderer por Phaser ou adicionar saves em nuvem/multiplayer depois.
