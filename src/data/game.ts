// Receitas, lojas, máquinas, armas, monstros, Casa dos Ofícios, construções, festivais, cartas e missões.
import type { ItemStack } from '../state/state';

// ---------------- RECEITAS DE FABRICAÇÃO ----------------
export interface Recipe { id: string; qty: number; ing: [string, number][]; unlock: string; }
export const RECIPES: Recipe[] = [
  { id: 'bau', qty: 1, ing: [['madeira', 50]], unlock: 'start' },
  { id: 'tocha', qty: 1, ing: [['madeira', 1], ['seiva', 2]], unlock: 'start' },
  { id: 'cerca', qty: 1, ing: [['madeira', 2]], unlock: 'start' },
  { id: 'caminho_madeira', qty: 1, ing: [['madeira', 1]], unlock: 'start' },
  { id: 'caminho_pedra', qty: 1, ing: [['pedra', 1]], unlock: 'start' },
  { id: 'espantalho', qty: 1, ing: [['madeira', 50], ['carvao', 1], ['fibra', 20]], unlock: 'farming:1' },
  { id: 'adubo', qty: 1, ing: [['seiva', 2], ['fibra', 1]], unlock: 'farming:1' },
  { id: 'cerca_pedra', qty: 1, ing: [['pedra', 2]], unlock: 'farming:2' },
  { id: 'aspersor', qty: 1, ing: [['bar_cobre', 1], ['bar_ferro', 1]], unlock: 'farming:2' },
  { id: 'maq_maionese', qty: 1, ing: [['madeira', 15], ['pedra', 15], ['quartzo', 1], ['bar_cobre', 1]], unlock: 'farming:2' },
  { id: 'acelerador', qty: 5, ing: [['fibra', 5], ['argila', 1]], unlock: 'farming:3' },
  { id: 'abelheira', qty: 1, ing: [['madeira', 40], ['carvao', 8], ['bar_ferro', 1], ['xarope', 1]], unlock: 'farming:3' },
  { id: 'moedor', qty: 1, ing: [['madeira', 50], ['pedra', 30], ['bar_cobre', 2]], unlock: 'farming:3' },
  { id: 'conservadora', qty: 1, ing: [['madeira', 50], ['pedra', 40], ['carvao', 8]], unlock: 'farming:4' },
  { id: 'solo_umido', qty: 2, ing: [['pedra', 2], ['argila', 1]], unlock: 'farming:4' },
  { id: 'barril', qty: 1, ing: [['madeira', 30], ['bar_cobre', 1], ['bar_ferro', 1], ['resina', 1]], unlock: 'farming:5' },
  { id: 'prensa', qty: 1, ing: [['madeira', 45], ['pedra', 45], ['madeira_dura', 10], ['bar_cobre', 1]], unlock: 'farming:6' },
  { id: 'aspersor_q', qty: 1, ing: [['bar_ferro', 1], ['bar_ouro', 1], ['quartzo', 1]], unlock: 'farming:6' },
  { id: 'adubo_q', qty: 2, ing: [['adubo', 2], ['gel', 1]], unlock: 'farming:6' },
  { id: 'tear', qty: 1, ing: [['madeira', 60], ['fibra', 30], ['resina', 1]], unlock: 'farming:7' },
  { id: 'sementeira', qty: 1, ing: [['madeira', 25], ['carvao', 10], ['bar_ouro', 1]], unlock: 'farming:8' },
  { id: 'aspersor_a', qty: 1, ing: [['bar_ouro', 1], ['bar_astral', 1]], unlock: 'farming:9' },
  { id: 'fornalha', qty: 1, ing: [['min_cobre', 20], ['pedra', 25]], unlock: 'mail:otavio_fornalha' },
  { id: 'poste', qty: 1, ing: [['madeira', 50], ['bar_ferro', 1]], unlock: 'mining:3' },
  { id: 'tonico', qty: 1, ing: [['fibra', 10], ['seiva', 5]], unlock: 'foraging:2' },
  { id: 'extrator', qty: 1, ing: [['madeira', 40], ['bar_cobre', 2]], unlock: 'foraging:3' },
  { id: 'carvoeira', qty: 1, ing: [['madeira', 20], ['bar_cobre', 2]], unlock: 'foraging:4' },
  { id: 'totem_casa', qty: 1, ing: [['madeira_dura', 1], ['fibra', 10]], unlock: 'foraging:4' },
  { id: 'totem_chuva', qty: 1, ing: [['madeira_dura', 1], ['seiva', 5], ['fibra', 10]], unlock: 'foraging:6' },
  { id: 'isca', qty: 5, ing: [['carapaca', 1]], unlock: 'fishing:2' },
  { id: 'pocao', qty: 1, ing: [['gel', 5], ['asa', 1]], unlock: 'combat:3' },
  { id: 'funil', qty: 1, ing: [['madeira', 50], ['bar_cobre', 1]], unlock: 'hall:curral' },
  { id: 'coletor', qty: 1, ing: [['madeira', 25], ['bar_ouro', 1], ['quartzo', 2]], unlock: 'hall:curral' },
];

// ---------------- RECEITAS DE COZINHA ----------------
export const COOKING: Recipe[] = [
  { id: 'salada', qty: 1, ing: [['alface', 1]], unlock: 'start' },
  { id: 'omelete', qty: 1, ing: [['ovo', 1], ['leite', 1]], unlock: 'start' },
  { id: 'peixe_assado', qty: 1, ing: [['cat:fish', 1]], unlock: 'start' },
  { id: 'pao', qty: 1, ing: [['farinha', 1]], unlock: 'start' },
  { id: 'refogado', qty: 1, ing: [['couve', 1], ['alho', 1]], unlock: 'tv' },
  { id: 'panqueca', qty: 1, ing: [['farinha', 1], ['ovo', 1]], unlock: 'tv' },
  { id: 'sopa_abobora', qty: 1, ing: [['abobora', 1], ['leite', 1]], unlock: 'tv' },
  { id: 'ensopado', qty: 1, ing: [['cogumelo', 1], ['batata', 1]], unlock: 'tv' },
  { id: 'torta', qty: 1, ing: [['farinha', 1], ['cat:fruit', 2]], unlock: 'tv' },
  { id: 'pizza', qty: 1, ing: [['farinha', 1], ['tomate', 1], ['queijo', 1]], unlock: 'tv' },
  { id: 'moqueca', qty: 1, ing: [['cat:fish', 1], ['tomate', 1], ['pimenta', 1]], unlock: 'tv' },
  { id: 'bolo', qty: 1, ing: [['milho', 1], ['ovo', 1], ['leite', 1]], unlock: 'mail:lucia_bolo' },
  { id: 'doce_leite', qty: 1, ing: [['leite', 2]], unlock: 'event' },
  { id: 'caldo_peixe', qty: 1, ing: [['cat:fish', 2], ['alho', 1]], unlock: 'event' },
];
export const TV_RECIPES = ['refogado', 'panqueca', 'ensopado', 'torta', 'sopa_abobora', 'moqueca', 'pizza'];

// ---------------- LOJAS ----------------
export interface ShopEntry { id: string; price: number; seasons?: number[]; req?: string; special?: string; label?: string; desc?: string }
export interface ShopDef { id: string; name: string; npc: string; greeting: string; items: ShopEntry[]; buys?: string[] }

export const SHOPS: Record<string, ShopDef> = {
  venda: {
    id: 'venda', name: 'Venda Arruda', npc: 'bento', greeting: 'O que vai levar hoje?', buys: ['crop', 'fruit', 'flower', 'forage', 'seed', 'artisan', 'animal', 'food', 'resource'],
    items: [
      ...['nabo', 'rabanete', 'alface', 'batata', 'couve', 'alho', 'feijao', 'tulipa'].map(c => ({ id: 'sem_' + c, price: 0, seasons: [0] })),
      ...['tomate', 'milho', 'melao', 'pimenta', 'mirtilo', 'girassol', 'trigo', 'abobrinha', 'maracuja', 'lupulo'].map(c => ({ id: 'sem_' + c, price: 0, seasons: [1] })),
      ...['abobora', 'uva', 'berinjela', 'beterraba', 'batatadoce', 'amora', 'inhame', 'brocolis', 'alcachofra', 'cenoura', 'milho', 'girassol', 'trigo'].map(c => ({ id: 'sem_' + c, price: 0, seasons: [2] })),
      { id: 'sem_inverno', price: 30, seasons: [3] },
      { id: 'adubo', price: 100 }, { id: 'solo_umido', price: 100, req: 'year2' }, { id: 'acelerador', price: 100 },
      { id: 'muda_cerejeira', price: 3400 }, { id: 'muda_damasqueiro', price: 2000 }, { id: 'muda_laranjeira', price: 4000 }, { id: 'muda_pessegueiro', price: 6000 }, { id: 'muda_macieira', price: 4000 }, { id: 'muda_romazeira', price: 6000 },
      { id: 'pao', price: 120 }, { id: 'cafe', price: 60 }, { id: 'farinha', price: 100 }, { id: 'buque', price: 200 },
      { id: 'mochila', price: 2000, special: 'backpack1', label: 'Mochila Grande (36 espaços)', desc: 'Aumenta o inventário para 36 espaços.' },
      { id: 'mochila', price: 10000, special: 'backpack2', label: 'Mochila de Viajante (48 espaços)', desc: 'Aumenta o inventário para 48 espaços.' },
    ],
  },
  taverna: {
    id: 'taverna', name: 'Taverna Lamparina', npc: 'raul', greeting: 'Senta, a casa é sua. Vai querer o quê?', buys: ['fish', 'food', 'artisan'],
    items: [{ id: 'cafe', price: 80 }, { id: 'pastel', price: 150 }, { id: 'sopa_dia', price: 200 }, { id: 'pizza', price: 600 }, { id: 'cerveja', price: 400 }, { id: 'moqueca', price: 750 }, { id: 'bolo', price: 300 }],
  },
  forja: {
    id: 'forja', name: 'Forja Ferraz', npc: 'otavio', greeting: 'Diga logo o que precisa.', buys: ['ore', 'bar', 'gem'],
    items: [{ id: 'min_cobre', price: 75 }, { id: 'min_ferro', price: 150 }, { id: 'min_ouro', price: 400, req: 'mine40' }, { id: 'carvao', price: 150 }, { id: 'upgrade', price: 0, special: 'tools', label: 'Melhorar ferramentas…', desc: 'Leve dinheiro e barras.' }],
  },
  carpintaria: {
    id: 'carpintaria', name: 'Carpintaria Cerne', npc: 'zeca', greeting: 'Em que posso ajudar?', buys: ['resource'],
    items: [
      { id: 'madeira', price: 10 }, { id: 'pedra', price: 20 }, { id: 'madeira_dura', price: 120, req: 'year2' },
      { id: 'construir', price: 0, special: 'build', label: 'Construções da fazenda…', desc: 'Galinheiro, celeiro, silo, poço, estábulo.' },
      { id: 'reforma', price: 0, special: 'house', label: 'Reformar a casa…', desc: 'Cozinha, quartos maiores.' },
      { id: 'cadeira', price: 300 }, { id: 'mesa', price: 750 }, { id: 'tapete', price: 1200 }, { id: 'tapete_verde', price: 1200 }, { id: 'vaso', price: 400 }, { id: 'quadro', price: 1000 }, { id: 'quadro_mar', price: 1000 },
      { id: 'luminaria', price: 650 }, { id: 'estante', price: 900 }, { id: 'banco', price: 500 }, { id: 'relogio', price: 800 }, { id: 'sofa', price: 1500 },
    ],
  },
  pesca: {
    id: 'pesca', name: 'Anzol Dourado', npc: 'joao', greeting: 'Peixe bom é peixe fisgado! O que vai ser?', buys: ['fish', 'trash', 'bait'],
    items: [{ id: 'isca', price: 5 }, { id: 'vara1', price: 1800, special: 'rod1', label: 'Vara de Bambu Reforçado', desc: 'Barra de captura maior. (Pesca 2)' }, { id: 'vara2', price: 7500, special: 'rod2', label: 'Vara de Fibra', desc: 'Barra bem maior e peixes mordem mais rápido. (Pesca 6)' }, { id: 'caldo_peixe', price: 500 }],
  },
  rancho: {
    id: 'rancho', name: 'Rancho Campos', npc: 'dora', greeting: 'Bicho ou feno?', buys: ['animal'],
    items: [{ id: 'feno', price: 50 }, { id: 'animais', price: 0, special: 'animals', label: 'Comprar animais…', desc: 'Galinhas, patos, vacas, cabras e ovelhas.' }],
  },
  clinica: {
    id: 'clinica', name: 'Clínica', npc: 'nina', greeting: 'Precisa de alguma coisa? Cuide-se, tá?',
    items: [{ id: 'tonico', price: 150 }, { id: 'pocao', price: 300 }],
  },
  posto: {
    id: 'posto', name: 'Posto do Guarda', npc: 'gil', greeting: 'Precisa de aço afiado?', buys: ['monster', 'gem', 'weapon'],
    items: [{ id: 'espada_aco', price: 1200 }, { id: 'adaga', price: 600 }, { id: 'martelo', price: 2500, req: 'mine20' }, { id: 'espada_cristal', price: 6000, req: 'mine40' }, { id: 'adaga_brasa', price: 8000, req: 'mine60' }, { id: 'martelo_lava', price: 15000, req: 'mine75' }, { id: 'pocao', price: 300 }, { id: 'tocha', price: 15 }],
  },
  selma: {
    id: 'selma', name: 'Ervas da Selma', npc: 'selma', greeting: 'As raízes sussurram seu nome. O que procura?', buys: ['forage', 'flower'],
    items: [{ id: 'sem_cebolaneve', price: 250, seasons: [3] }, { id: 'sem_liriolunar', price: 1500, req: 'hall:bosque' }, { id: 'totem_chuva', price: 600, req: 'hall:bosque' }, { id: 'totem_casa', price: 400 }, { id: 'adubo_q', price: 150 }, { id: 'tonico', price: 120 }, { id: 'hortela', price: 150 }],
  },
  biblioteca: { id: 'biblioteca', name: 'Arquivo do Vale', npc: 'caio', greeting: 'Quer ver as coleções do arquivo?', items: [{ id: 'colecao', price: 0, special: 'collection', label: 'Ver coleções…', desc: 'Peixes, minerais, envios e receitas.' }] },
  comerciante: { id: 'comerciante', name: 'Comerciante Itinerante', npc: '', greeting: 'Raridades de terras distantes! Hoje e só hoje!', items: [] },
};
export const MERCHANT_POOL = ['sem_ruibarbo', 'sem_morango', 'sem_cebolaneve', 'sem_alcachofra', 'frutacristal', 'diamante', 'pena', 'la', 'madeira_dura', 'bar_ouro', 'muda_pessegueiro', 'xarope', 'queijo_cabra', 'pocao', 'totem_chuva', 'sofa', 'quadro_mar', 'sem_liriolunar', 'esmeralda'];

// ---------------- MÁQUINAS ----------------
export interface MachineRule { input: string; inQty?: number; output: string | ((input: string) => { id: string; ref?: string }); minutes: number; outQty?: number; keepQuality?: boolean; extra?: [string, number] }
export const MACHINES: Record<string, MachineRule[]> = {
  fornalha: [
    { input: 'min_cobre', inQty: 5, output: 'bar_cobre', minutes: 30, extra: ['carvao', 1] }, { input: 'min_ferro', inQty: 5, output: 'bar_ferro', minutes: 120, extra: ['carvao', 1] },
    { input: 'min_ouro', inQty: 5, output: 'bar_ouro', minutes: 300, extra: ['carvao', 1] }, { input: 'min_astral', inQty: 5, output: 'bar_astral', minutes: 480, extra: ['carvao', 1] },
    { input: 'quartzo', output: 'bar_cobre', minutes: 90, extra: ['carvao', 1] },
  ],
  conservadora: [{ input: 'cat:fruit', output: (i) => ({ id: 'geleia', ref: i }), minutes: 3000 }, { input: 'cat:crop', output: (i) => ({ id: 'conserva', ref: i }), minutes: 3000 }],
  barril: [{ input: 'cat:fruit', output: (i) => ({ id: 'vinho', ref: i }), minutes: 7 * 1440 }, { input: 'cat:crop', output: (i) => ({ id: 'suco', ref: i }), minutes: 4 * 1440 }, { input: 'trigo', output: 'cerveja', minutes: 1750 }, { input: 'lupulo', output: 'pale', minutes: 2250 }, { input: 'cafe', output: 'cafe', minutes: 120 }],
  prensa: [{ input: 'leite', output: 'queijo', minutes: 200 }, { input: 'leite_grande', output: 'queijo', minutes: 200, outQty: 2 }, { input: 'leite_cabra', output: 'queijo_cabra', minutes: 200 }],
  maq_maionese: [{ input: 'ovo', output: 'maionese', minutes: 180 }, { input: 'ovo_grande', output: 'maionese', minutes: 180, outQty: 2 }, { input: 'ovo_pato', output: 'maionese_pato', minutes: 180 }],
  tear: [{ input: 'la', output: 'tecido', minutes: 240 }],
  moedor: [{ input: 'trigo', output: 'farinha', minutes: 180 }, { input: 'milho', output: 'farinha', minutes: 180 }],
  carvoeira: [{ input: 'madeira', inQty: 10, output: 'carvao', minutes: 30 }],
  sementeira: [{ input: 'cat:crop', output: (i) => ({ id: 'sem_' + i }), minutes: 20, outQty: 2 }, { input: 'cat:fruit', output: (i) => ({ id: 'sem_' + i }), minutes: 20, outQty: 2 }, { input: 'cat:flower', output: (i) => ({ id: 'sem_' + i }), minutes: 20, outQty: 2 }],
};
export const MACHINE_HINT: Record<string, string> = {
  fornalha: 'Coloque 5 minérios (precisa de 1 carvão).', conservadora: 'Coloque uma fruta ou vegetal.', barril: 'Coloque fruta, vegetal, trigo ou lúpulo.', prensa: 'Coloque leite.', maq_maionese: 'Coloque um ovo.',
  tear: 'Coloque lã.', moedor: 'Coloque trigo ou milho.', carvoeira: 'Coloque 10 madeiras.', sementeira: 'Coloque uma colheita.',
};

// ---------------- ARMAS ----------------
export interface WeaponDef { id: string; type: 'sword' | 'dagger' | 'hammer'; dmg: [number, number]; cooldown: number; range: number; knock: number; crit: number }
export const WEAPONS: Record<string, WeaponDef> = {
  espada_velha: { id: 'espada_velha', type: 'sword', dmg: [2, 5], cooldown: 380, range: 22, knock: 1, crit: 0.02 },
  espada_aco: { id: 'espada_aco', type: 'sword', dmg: [8, 14], cooldown: 360, range: 24, knock: 1.1, crit: 0.03 },
  espada_cristal: { id: 'espada_cristal', type: 'sword', dmg: [22, 32], cooldown: 340, range: 26, knock: 1.2, crit: 0.05 },
  adaga: { id: 'adaga', type: 'dagger', dmg: [5, 9], cooldown: 220, range: 16, knock: 0.5, crit: 0.08 },
  adaga_brasa: { id: 'adaga_brasa', type: 'dagger', dmg: [24, 34], cooldown: 200, range: 18, knock: 0.6, crit: 0.12 },
  martelo: { id: 'martelo', type: 'hammer', dmg: [16, 26], cooldown: 600, range: 26, knock: 2, crit: 0.02 },
  martelo_lava: { id: 'martelo_lava', type: 'hammer', dmg: [48, 64], cooldown: 560, range: 28, knock: 2.4, crit: 0.04 },
};

// ---------------- MONSTROS ----------------
export interface MonsterDef { id: string; name: string; hp: number; dmg: number; speed: number; ai: 'hop' | 'fly' | 'crawl' | 'ambush' | 'float' | 'golem'; xp: number; drops: [string, number, number][]; levels: [number, number]; }
export const MONSTERS: MonsterDef[] = [
  { id: 'slime', name: 'Gosma Verde', hp: 24, dmg: 5, speed: 0.6, ai: 'hop', xp: 3, drops: [['gel', 0.8, 1], ['min_cobre', 0.1, 2]], levels: [1, 30] },
  { id: 'besouro', name: 'Besouro de Túnel', hp: 18, dmg: 6, speed: 0.9, ai: 'crawl', xp: 4, drops: [['carapaca', 0.6, 1]], levels: [1, 35] },
  { id: 'caranguejo', name: 'Caranguejo-de-Pedra', hp: 40, dmg: 7, speed: 0.8, ai: 'ambush', xp: 6, drops: [['min_cobre', 0.5, 2], ['pedra', 0.8, 3]], levels: [5, 40] },
  { id: 'morcego', name: 'Morcego das Galerias', hp: 26, dmg: 7, speed: 1.3, ai: 'fly', xp: 5, drops: [['asa', 0.6, 1]], levels: [10, 45] },
  { id: 'slime_azul', name: 'Gosma Gélida', hp: 70, dmg: 10, speed: 0.75, ai: 'hop', xp: 8, drops: [['gel', 0.8, 2], ['min_ferro', 0.15, 2]], levels: [21, 60] },
  { id: 'morcego_cristal', name: 'Morcego de Cristal', hp: 80, dmg: 13, speed: 1.5, ai: 'fly', xp: 10, drops: [['asa', 0.5, 1], ['poeira', 0.4, 1], ['quartzo', 0.2, 1]], levels: [41, 70] },
  { id: 'espirito', name: 'Espírito do Musgo', hp: 95, dmg: 14, speed: 1.0, ai: 'float', xp: 12, drops: [['essencia', 0.5, 1], ['poeira', 0.3, 1]], levels: [41, 80] },
  { id: 'slime_magma', name: 'Gosma de Magma', hp: 150, dmg: 18, speed: 0.9, ai: 'hop', xp: 15, drops: [['gel', 0.8, 2], ['min_ouro', 0.2, 2], ['quartzofogo', 0.1, 1]], levels: [61, 999] },
  { id: 'golem', name: 'Golem de Cinzas', hp: 260, dmg: 22, speed: 0.6, ai: 'golem', xp: 25, drops: [['cinza', 0.4, 1], ['min_astral', 0.3, 1], ['min_ouro', 0.5, 2]], levels: [61, 999] },
  { id: 'sombra', name: 'Sombra Errante', hp: 180, dmg: 20, speed: 1.2, ai: 'float', xp: 20, drops: [['essencia', 0.7, 1], ['min_astral', 0.15, 1]], levels: [66, 999] },
];

// ---------------- CASA DOS OFÍCIOS ----------------
export interface HallSet { id: string; name: string; items: [string, number, number?][]; need?: number }
export interface HallSector { id: string; name: string; guild: string; color: string; reward: string; sets: HallSet[] }
export const HALL: HallSector[] = [
  { id: 'lavoura', name: 'Altar da Lavoura', guild: 'Guilda dos Lavradores', color: '#6ab84a', reward: 'Restaura a estufa da sua fazenda: plante qualquer coisa em qualquer estação.', sets: [
    { id: 'prim', name: 'Colheita de Primavera', items: [['nabo', 1], ['alface', 1], ['batata', 1], ['couve', 1], ['alho', 1]] },
    { id: 'ver', name: 'Colheita de Verão', items: [['tomate', 1], ['milho', 1], ['melao', 1], ['pimenta', 1], ['mirtilo', 1]] },
    { id: 'out', name: 'Colheita de Outono', items: [['abobora', 1], ['uva', 1], ['berinjela', 1], ['beterraba', 1], ['inhame', 1]] },
    { id: 'qual', name: 'Lavoura de Excelência', items: [['nabo', 5, 2], ['tomate', 5, 2], ['abobora', 5, 2], ['milho', 5, 2]], need: 3 },
  ] },
  { id: 'aguas', name: 'Altar das Águas', guild: 'Guilda dos Pescadores', color: '#4a9ad8', reward: 'Reconstrói a ponte para a Enseada Esquecida, na praia.', sets: [
    { id: 'rio', name: 'Peixes de Rio', items: [['lambari', 1], ['tilapia', 1], ['traira', 1], ['salmao', 1]] },
    { id: 'lago', name: 'Peixes de Lago', items: [['carpa', 1], ['tucunare', 1], ['esturjao', 1], ['percalunar', 1]] },
    { id: 'mar', name: 'Peixes do Mar', items: [['sardinha', 1], ['anchova', 1], ['atum', 1], ['linguado', 1]] },
    { id: 'noite', name: 'Pescadores da Noite', items: [['enguia', 1], ['lula', 1], ['bagre', 1]] },
  ] },
  { id: 'profundezas', name: 'Altar das Profundezas', guild: 'Guilda dos Mineiros', color: '#c87a4a', reward: 'Reativa o carrinho de mina: viagem rápida entre minas, vila e fazenda.', sets: [
    { id: 'forja', name: 'Barras da Forja', items: [['bar_cobre', 1], ['bar_ferro', 1], ['bar_ouro', 1]] },
    { id: 'gemas', name: 'Brilho das Galerias', items: [['quartzo', 1], ['ametista', 1], ['topazio', 1], ['jade', 1], ['rubi', 1]], need: 4 },
    { id: 'caca', name: 'Troféus de Caça', items: [['gel', 10], ['asa', 5], ['carapaca', 5]] },
  ] },
  { id: 'bosque', name: 'Altar do Bosque', guild: 'Guilda dos Coletores', color: '#4a8a5a', reward: 'Selma passa a vender lírios-lunares e totens raros.', sets: [
    { id: 'prim', name: 'Coleta de Primavera', items: [['alhoporo', 1], ['dentedeleao', 1], ['narciso', 1], ['raizforte', 1]] },
    { id: 'ver', name: 'Coleta de Verão', items: [['framboesa', 1], ['lirio', 1], ['uvamato', 1]] },
    { id: 'out', name: 'Coleta de Outono', items: [['amorasilv', 1], ['avela', 1], ['cogumelo', 1], ['ameixamato', 1]] },
    { id: 'inv', name: 'Coleta de Inverno', items: [['raizinverno', 1], ['frutacristal', 1], ['azevinho', 1], ['crocus', 1]] },
    { id: 'obra', name: 'Materiais de Obra', items: [['madeira', 99], ['pedra', 99], ['madeira_dura', 10]] },
  ] },
  { id: 'curral', name: 'Altar do Curral', guild: 'Guilda dos Criadores', color: '#d8b06a', reward: 'Ensina a fabricar o Funil de Feno e o Coletor Automático.', sets: [
    { id: 'ovos', name: 'Cesto de Ovos', items: [['ovo', 1], ['ovo_grande', 1], ['ovo_pato', 1]], need: 2 },
    { id: 'leite', name: 'Balde de Leite', items: [['leite', 1], ['leite_cabra', 1], ['leite_grande', 1]], need: 2 },
    { id: 'fibras', name: 'Fibras do Celeiro', items: [['la', 1], ['feno', 10], ['pena', 1]], need: 2 },
  ] },
  { id: 'artesanato', name: 'Altar do Artesanato', guild: 'Guilda dos Artesãos', color: '#a85ad8', reward: 'O comerciante itinerante passa a visitar a vila às sextas e domingos.', sets: [
    { id: 'despensa', name: 'Despensa', items: [['geleia', 1], ['conserva', 1], ['mel', 1], ['xarope', 1]], need: 3 },
    { id: 'adega', name: 'Adega', items: [['vinho', 1], ['cerveja', 1], ['suco', 1], ['pale', 1]], need: 3 },
    { id: 'laticinio', name: 'Laticínios e Tecidos', items: [['queijo', 1], ['maionese', 1], ['tecido', 1]] },
  ] },
];

// ---------------- CONSTRUÇÕES ----------------
export interface BuildDef { id: string; name: string; cost: number; mats: [string, number][]; days: number; w: number; h: number; doorX: number; desc: string; upgradeOf?: string; animalHouse?: 'coop' | 'barn' }
export const BUILDS: BuildDef[] = [
  { id: 'galinheiro', name: 'Galinheiro', cost: 4000, mats: [['madeira', 300], ['pedra', 100]], days: 3, w: 6, h: 3, doorX: 1, desc: 'Abriga até 4 aves (galinhas).', animalHouse: 'coop' },
  { id: 'galinheiro_g', name: 'Galinheiro Grande', cost: 10000, mats: [['madeira', 400], ['pedra', 150]], days: 3, w: 6, h: 3, doorX: 1, desc: 'Até 8 aves. Permite patos.', upgradeOf: 'galinheiro', animalHouse: 'coop' },
  { id: 'celeiro', name: 'Celeiro', cost: 6000, mats: [['madeira', 350], ['pedra', 150]], days: 3, w: 7, h: 4, doorX: 3, desc: 'Abriga até 4 animais grandes (vacas).', animalHouse: 'barn' },
  { id: 'celeiro_g', name: 'Celeiro Grande', cost: 12000, mats: [['madeira', 450], ['pedra', 200]], days: 3, w: 7, h: 4, doorX: 3, desc: 'Até 8 animais. Permite cabras e ovelhas.', upgradeOf: 'celeiro', animalHouse: 'barn' },
  { id: 'silo', name: 'Silo', cost: 100, mats: [['pedra', 100], ['argila', 10], ['bar_cobre', 5]], days: 1, w: 3, h: 3, doorX: -1, desc: 'Guarda até 240 feno. Cortar grama com a foice gera feno.' },
  { id: 'poco', name: 'Poço', cost: 1000, mats: [['pedra', 75]], days: 1, w: 3, h: 3, doorX: -1, desc: 'Reabasteça o regador sem ir até o lago.' },
  { id: 'estabulo', name: 'Estábulo', cost: 10000, mats: [['madeira_dura', 100], ['bar_ferro', 5]], days: 2, w: 4, h: 3, doorX: -1, desc: 'Vem com um cavalo! Viaje muito mais rápido.' },
];
export const HOUSE_UPGRADES = [
  { level: 1, cost: 10000, mats: [['madeira', 450]] as [string, number][], desc: 'Adiciona uma cozinha: cozinhe receitas!' },
  { level: 2, cost: 50000, mats: [['madeira_dura', 150]] as [string, number][], desc: 'Um quarto extra e mais espaço para decorar.' },
];

// ---------------- ANIMAIS ----------------
export interface AnimalDef { id: string; name: string; price: number; house: 'coop' | 'barn'; houseLevel: number; produce: string; deluxe?: string; every: number; babyDays: number; colors: string[]; sound: string }
export const ANIMALS: AnimalDef[] = [
  { id: 'galinha', name: 'Galinha', price: 800, house: 'coop', houseLevel: 0, produce: 'ovo', deluxe: 'ovo_grande', every: 1, babyDays: 3, colors: ['#f8f4f0', '#c88a4a', '#5a4a3a'], sound: 'cluck' },
  { id: 'pato', name: 'Pato', price: 1200, house: 'coop', houseLevel: 1, produce: 'ovo_pato', deluxe: 'pena', every: 2, babyDays: 5, colors: ['#f0f0e8', '#8a7a5a'], sound: 'quack' },
  { id: 'vaca', name: 'Vaca', price: 1500, house: 'barn', houseLevel: 0, produce: 'leite', deluxe: 'leite_grande', every: 1, babyDays: 5, colors: ['#f0ece0', '#8a5a3a', '#3a2a22'], sound: 'moo' },
  { id: 'cabra', name: 'Cabra', price: 4000, house: 'barn', houseLevel: 1, produce: 'leite_cabra', every: 2, babyDays: 5, colors: ['#e8e0d0', '#8a6a4a'], sound: 'bleat' },
  { id: 'ovelha', name: 'Ovelha', price: 8000, house: 'barn', houseLevel: 1, produce: 'la', every: 3, babyDays: 4, colors: ['#f8f4f0', '#d8d0c0'], sound: 'baa' },
];

// ---------------- FESTIVAIS ----------------
export interface FestivalDef { id: string; name: string; season: number; day: number; from: number; to: number; activity: 'hunt' | 'dance' | 'soup' | 'cutscene' | 'judge' | 'fishing' | 'gifts'; desc: string; shop?: ShopEntry[]; intro: string; }
export const FESTIVALS: FestivalDef[] = [
  { id: 'sementes', name: 'Festa das Sementes', season: 0, day: 13, from: 540, to: 840, activity: 'hunt', desc: 'Encontre as sementes pintadas escondidas pela praça!', intro: 'A praça está coberta de bandeirinhas. Crianças correm atrás de sementes pintadas.', shop: [{ id: 'sem_morango', price: 100 }, { id: 'sem_tulipa', price: 20 }, { id: 'vaso', price: 400 }] },
  { id: 'flores', name: 'Baile das Flores', season: 0, day: 24, from: 540, to: 840, activity: 'dance', desc: 'Convide alguém especial para dançar.', intro: 'Guirlandas de flores enfeitam a vila inteira. Uma banda toca na praça.', shop: [{ id: 'tulipa', price: 60 }, { id: 'buque', price: 200 }] },
  { id: 'caldeirao', name: 'Caldeirão Comunitário', season: 1, day: 11, from: 540, to: 840, activity: 'soup', desc: 'Cada morador coloca um ingrediente no caldeirão gigante.', intro: 'Um caldeirão enorme borbulha na praça. A prefeita prova a sopa no fim.' },
  { id: 'vagalumes', name: 'Noite dos Vaga-lumes', season: 1, day: 28, from: 1200, to: 1380, activity: 'cutscene', desc: 'A vila se reúne na praia para ver os vaga-lumes.', intro: 'Ao anoitecer, milhares de vaga-lumes sobem do mangue. Todos assistem em silêncio.' },
  { id: 'colheita', name: 'Feira da Colheita', season: 2, day: 16, from: 540, to: 900, activity: 'judge', desc: 'Exponha seu melhor produto para o júri.', intro: 'Barracas coloridas tomam a praça. O júri avalia o melhor produto do vale.', shop: [{ id: 'muda_macieira', price: 3500 }, { id: 'quadro', price: 800 }, { id: 'sem_amora', price: 220 }] },
  { id: 'lanternas', name: 'Noite das Lanternas', season: 2, day: 27, from: 1200, to: 1380, activity: 'cutscene', desc: 'Lanternas de papel sobem ao céu em memória de quem partiu.', intro: 'Cada morador acende uma lanterna de papel. Elas sobem devagar sobre o rio.' },
  { id: 'gelo', name: 'Festival do Gelo', season: 3, day: 8, from: 540, to: 840, activity: 'fishing', desc: 'Concurso de pesca no gelo! Pegue o máximo de peixes.', intro: 'O rio da vila congelou nas margens. Buracos de pesca foram abertos no gelo.' },
  { id: 'ceia', name: 'Ceia de Inverno', season: 3, day: 25, from: 540, to: 840, activity: 'gifts', desc: 'Troca de presentes secreta entre os moradores.', intro: 'Uma mesa enorme foi posta na praça. Todos trazem um presente embrulhado.' },
];

// ---------------- CARTAS ----------------
export interface MailDef { id: string; from: string; text: string; when: (s: any) => boolean; attach?: ItemStack[]; recipe?: string; cooking?: string; money?: number; quest?: string; flag?: string }
export const MAIL: MailDef[] = [
  { id: 'boasvindas', from: 'Aurélia Prado', text: 'Olá, @nome!\n\nBoas-vindas ao Vale da Candeia! Sua tia-avó Celeste deixou a fazenda aos seus cuidados. Está tudo um pouco... selvagem. Mas sei que você dará conta.\n\nPasse na vila para conhecer os moradores. Todos estão curiosos!\n\n— Aurélia, prefeita', when: s => s.time.day >= 2 || s.time.season > 0, quest: 'q_moradores' },
  { id: 'quinzinho_vara', from: 'Quinzinho Vaz', text: 'Ê, menina!\n\nTô sabendo que tem gente nova no vale. Passa lá no Anzol Dourado, na praia, que eu tenho uma vara de pescar sobrando.\n\nPeixe não espera!\n— Quinzinho', when: s => s.time.day >= 2 || s.time.season > 0, quest: 'q_pesca' },
  { id: 'rosa_sementes', from: 'Rosa Lins', text: 'Olá!\n\nSobraram algumas sementes de couve da horta comunitária. Achei que você poderia aproveitar.\n\nBoa colheita!\n— Rosa', when: s => s.time.season === 0 && s.time.day >= 3 && s.time.year === 1, attach: [{ id: 'sem_couve', qty: 5 }] },
  { id: 'gil_minas', from: 'Gil Navarro', text: 'Aviso:\n\nO desmoronamento da entrada das minas foi limpo. As Minas da Serra estão abertas novamente.\n\nSe for descer, passe no Posto. Tenho uma espada velha pra você.\n— Gil, guarda das minas', when: s => (s.time.day >= 5 || s.time.season > 0), flag: 'minesOpen', quest: 'q_minas' },
  { id: 'aurelia_hall', from: 'Aurélia Prado', text: 'Olá de novo!\n\nVocê já viu a Casa dos Ofícios, ao norte da praça? Era o coração da vila. Seis altares, um para cada guilda.\n\nA Vó Marta diz que, se alguém trouxer as oferendas certas, a casa volta a viver. Que tal dar uma olhada?\n— Aurélia', when: s => s.time.day >= 6 || s.time.season > 0, quest: 'q_hall' },
  { id: 'otavio_fornalha', from: 'Otávio Ferraz', text: 'Vi que você anda trazendo minério da mina.\n\nMinério cru não serve pra nada. Construa uma fornalha. Junte 20 de cobre e 25 de pedra.\n\nCom as barras, eu melhoro suas ferramentas.\n— Otávio', when: s => (s.stats.ore || 0) > 0, recipe: 'fornalha', quest: 'q_ferramenta' },
  { id: 'zeca_galinheiro', from: 'Zeca Madeira', text: 'Bom dia!\n\nSua fazenda está ficando bonita. Já pensou em criar galinhas? Um galinheiro custa 4.000 moedas, 300 madeiras e 100 pedras.\n\nSem pressa. Coisa boa demora.\n— Zeca', when: s => s.time.season >= 1 || s.time.year > 1 || (s.player.totalEarned || 0) > 5000, quest: 'q_galinheiro' },
  { id: 'teo_convite', from: 'Teo Campos', text: 'Oi! Aqui é o Teo, do Rancho Campos.\n\nSe um dia quiser criar bichos, passa lá no rancho! É só seguir a trilha ao sul da sua fazenda, pela floresta.\n\nOs patos mandam lembranças.\n— Teo', when: s => s.time.day >= 4 || s.time.season > 0, quest: 'q_floresta' },
  { id: 'dora_feno', from: 'Dora Campos', text: 'Soube que você construiu um galinheiro!\n\nTe mandei um pouco de feno pra começar. Passe no rancho pra escolher seus bichinhos.\n— Dora', when: s => s.buildings.some((b: any) => b.type.startsWith('galinheiro') || b.type.startsWith('celeiro')), attach: [{ id: 'feno', qty: 20 }] },
  { id: 'lucia_bolo', from: 'Lúcia Arruda', text: 'Querida!\n\nSoube que você tem uma cozinha agora! Te mando minha receita de bolo de fubá. Não conta pro Bento que eu uso milho do seu sítio!\n— Lúcia', when: s => s.houseLevel >= 1, cooking: 'bolo' },
  { id: 'bento_verao', from: 'Bento Arruda', text: 'Chegou o verão!\n\nSementes de tomate, milho, melão e mais já estão na Venda. As de primavera não aguentam o calor, viu? Colha antes que murchem!\n— Bento', when: s => s.time.season === 1 && s.time.day === 1 },
  { id: 'bento_outono', from: 'Bento Arruda', text: 'Outono no vale!\n\nAbóbora, uva, beterraba... a Venda está cheia de sementes novas. Vem conferir!\n— Bento', when: s => s.time.season === 2 && s.time.day === 1 },
  { id: 'bento_inverno', from: 'Bento Arruda', text: 'Chegou o inverno.\n\nQuase nada cresce lá fora agora. Bom momento pra minerar, pescar, fazer amizades... e planejar a próxima primavera.\n\nTenho Sementes de Inverno na Venda, se quiser arriscar.\n— Bento', when: s => s.time.season === 3 && s.time.day === 1 },
  { id: 'selma_convite', from: 'Selma Rocha', text: 'Os espíritos das guildas se agitam.\n\nUm altar despertou. Eu senti.\n\nVenha me visitar na montanha. Sua tia sabia o caminho.\n— S.', when: s => s.hallDone.length >= 1, quest: 'q_selma' },
  { id: 'nina_cuidado', from: 'Dra. Nina Coutinho', text: 'Soube que você desmaiou ontem.\n\nPor favor, durma antes da meia-noite e coma antes de trabalhar pesado. Te mandei um tônico.\n\nSe cuide!\n— Nina', when: s => (s.stats.faints || 0) > 0, attach: [{ id: 'tonico', qty: 1 }] },
];

// ---------------- MISSÕES DE HISTÓRIA ----------------
export interface StoryQuest { id: string; title: string; desc: string; goal: string; target: number; reward: number; rewardItem?: ItemStack; next?: string; npc?: string }
export const STORY: StoryQuest[] = [
  { id: 'q_plantar', title: 'Plante suas primeiras sementes', desc: 'Use a enxada para preparar a terra e plante os nabos que você recebeu. Não esqueça de regar!', goal: 'plant', target: 10, reward: 100, next: 'q_colher' },
  { id: 'q_colher', title: 'Primeira colheita', desc: 'Regue seus nabos todos os dias até crescerem. Depois colha e coloque na caixa de envio ao lado da casa.', goal: 'ship_crop', target: 5, reward: 200, next: 'q_bau' },
  { id: 'q_bau', title: 'Organize-se', desc: 'Junte 50 madeiras e fabrique um baú (menu de fabricação, tecla C).', goal: 'craft:bau', target: 1, reward: 150 },
  { id: 'q_moradores', title: 'Conheça os moradores', desc: 'Visite a vila e converse com 10 moradores diferentes.', goal: 'meet', target: 10, reward: 300, next: 'q_amizade' },
  { id: 'q_amizade', title: 'Laços de amizade', desc: 'Alcance 3 corações com qualquer morador. Presentes ajudam!', goal: 'hearts3', target: 1, reward: 500 },
  { id: 'q_pesca', title: 'Uma vara de pescar', desc: 'Visite Quinzinho no Anzol Dourado, na praia ao sul da vila.', goal: 'rod', target: 1, reward: 0, next: 'q_peixe' },
  { id: 'q_peixe', title: 'O primeiro peixe', desc: 'Pesque qualquer peixe. Segure o botão para medir a força e mantenha o peixe dentro da barra verde!', goal: 'catch', target: 1, reward: 200, next: 'q_peixes' },
  { id: 'q_peixes', title: 'Conhecedor das águas', desc: 'Pesque 8 espécies diferentes. Peixes mudam conforme local, estação, horário e clima.', goal: 'species', target: 8, reward: 1000, rewardItem: { id: 'isca', qty: 50 } },
  { id: 'q_minas', title: 'As Minas da Serra', desc: 'Visite o Posto do Guarda na montanha e desça até o andar 5 das minas.', goal: 'mine', target: 5, reward: 300, next: 'q_minas20' },
  { id: 'q_minas20', title: 'Mais fundo', desc: 'Alcance o andar 20 das minas.', goal: 'mine', target: 20, reward: 1000, next: 'q_minas40' },
  { id: 'q_minas40', title: 'Os salões de cristal', desc: 'Alcance o andar 40 das minas.', goal: 'mine', target: 40, reward: 2500, next: 'q_minas80' },
  { id: 'q_minas80', title: 'A luz no fundo', desc: 'Alcance o andar 80 e descubra o que Gil viu.', goal: 'mine', target: 80, reward: 10000 },
  { id: 'q_ferramenta', title: 'Ferramentas melhores', desc: 'Construa uma fornalha, funda barras de cobre e leve-as a Otávio para melhorar uma ferramenta.', goal: 'upgrade', target: 1, reward: 500 },
  { id: 'q_hall', title: 'A Casa dos Ofícios', desc: 'Visite a Casa dos Ofícios ao norte da praça e entregue sua primeira oferenda.', goal: 'hallset', target: 1, reward: 300, next: 'q_hall_setor' },
  { id: 'q_hall_setor', title: 'O primeiro altar', desc: 'Complete todos os conjuntos de um altar da Casa dos Ofícios.', goal: 'hallsector', target: 1, reward: 1500, next: 'q_hall_tudo' },
  { id: 'q_hall_tudo', title: 'A candeia reacesa', desc: 'Restaure todos os seis altares da Casa dos Ofícios.', goal: 'hallsector', target: 6, reward: 25000 },
  { id: 'q_galinheiro', title: 'Cocoricó', desc: 'Construa um galinheiro com o Zeca e compre uma galinha no Rancho Campos.', goal: 'animal', target: 1, reward: 500 },
  { id: 'q_selma', title: 'A guardiã da montanha', desc: 'Selma, a herbalista, quer ver você. A casa dela fica na Serra do Candeeiro, a leste da entrada das minas.', goal: 'visit:casa_selma', target: 1, reward: 300 },
  { id: 'q_enseada', title: 'A Enseada Esquecida', desc: 'A ponte foi reconstruída! Explore a enseada no extremo leste da praia.', goal: 'visit:enseada', target: 1, reward: 800, rewardItem: { id: 'isca', qty: 30 } },
  { id: 'q_floresta', title: 'Caminhos do bosque', desc: 'Visite o Rancho Campos, na Floresta dos Ipês, ao sul da sua fazenda.', goal: 'visit:rancho', target: 1, reward: 150 },
  { id: 'q_riqueza', title: 'De volta ao azul', desc: 'Acumule 25.000 moedas de lucro total.', goal: 'earned', target: 25000, reward: 2000 },
];

export const REQUEST_ITEMS: string[][] = [
  ['nabo', 'alface', 'batata', 'couve', 'alho', 'tulipa', 'dentedeleao', 'narciso', 'sardinha', 'lambari', 'carpa', 'min_cobre', 'quartzo', 'ovo', 'leite'],
  ['tomate', 'milho', 'melao', 'pimenta', 'mirtilo', 'girassol', 'trigo', 'framboesa', 'truta', 'pacu', 'atum', 'min_ferro', 'ametista', 'ovo', 'leite', 'queijo'],
  ['abobora', 'uva', 'berinjela', 'beterraba', 'inhame', 'cenoura', 'avela', 'cogumelo', 'salmao', 'traira', 'cavala', 'min_ferro', 'topazio', 'maionese', 'queijo'],
  ['raizinverno', 'azevinho', 'frutacristal', 'lula', 'percalunar', 'luciosombrio', 'min_ouro', 'jade', 'bar_cobre', 'tecido', 'queijo', 'maionese', 'carvao'],
];
