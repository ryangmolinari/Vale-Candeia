// Registro de itens. Parte dos itens é gerada a partir de cultivos, peixes e árvores frutíferas.
import { CROPS, FRUIT_TREES } from './crops';
import { FISH } from './fish';

export type Cat = 'seed' | 'crop' | 'fruit' | 'flower' | 'forage' | 'fish' | 'ore' | 'bar' | 'gem' | 'resource' | 'animal' | 'artisan' |
  'food' | 'placeable' | 'furniture' | 'tool' | 'weapon' | 'special' | 'trash' | 'bait' | 'fertilizer' | 'monster' | 'sapling';

export interface IconSpec { s: string; c1: string; c2?: string; c3?: string }

export interface ItemDef {
  id: string; name: string; cat: Cat; price: number; icon: IconSpec; desc: string;
  energy?: number; hp?: number; stack?: number; quality?: boolean; place?: string;
  seedOf?: string; sapling?: string; tool?: string; weapon?: string; buff?: string;
}

export const CAT_NAMES: Record<Cat, string> = {
  seed: 'Semente', crop: 'Vegetal', fruit: 'Fruta', flower: 'Flor', forage: 'Coleta', fish: 'Peixe', ore: 'Minério', bar: 'Barra', gem: 'Mineral',
  resource: 'Recurso', animal: 'Produto animal', artisan: 'Artesanal', food: 'Comida', placeable: 'Fabricável', furniture: 'Mobília', tool: 'Ferramenta',
  weapon: 'Arma', special: 'Especial', trash: 'Lixo', bait: 'Isca', fertilizer: 'Fertilizante', monster: 'Espólio', sapling: 'Muda',
};

export const ITEMS: Record<string, ItemDef> = {};
function add(d: ItemDef) { ITEMS[d.id] = d; }
const it = (id: string, name: string, cat: Cat, price: number, icon: IconSpec, desc: string, extra: Partial<ItemDef> = {}) => add({ id, name, cat, price, icon, desc, ...extra });

// ---------- Ferramentas ----------
it('enxada', 'Enxada', 'tool', 0, { s: 'hoe', c1: '#8a8a8a' }, 'Prepara a terra para o plantio. Também desenterra artefatos.', { stack: 1, tool: 'hoe' });
it('machado', 'Machado', 'tool', 0, { s: 'axe', c1: '#8a8a8a' }, 'Corta galhos, tocos e árvores.', { stack: 1, tool: 'axe' });
it('picareta', 'Picareta', 'tool', 0, { s: 'pick', c1: '#8a8a8a' }, 'Quebra pedras e minérios.', { stack: 1, tool: 'pick' });
it('regador', 'Regador', 'tool', 0, { s: 'can', c1: '#8a8a8a' }, 'Rega plantações. Reabasteça em água.', { stack: 1, tool: 'can' });
it('foice', 'Foice', 'tool', 0, { s: 'scythe', c1: '#8a8a8a' }, 'Corta mato e colhe trigo. Com silo, gera feno.', { stack: 1, tool: 'scythe' });
it('vara', 'Vara de Pesca', 'tool', 0, { s: 'rod', c1: '#a8743a' }, 'Segure para medir a força e solte para lançar.', { stack: 1, tool: 'rod' });

// ---------- Armas ----------
it('espada_velha', 'Espada Enferrujada', 'weapon', 50, { s: 'sword', c1: '#9a7a5a' }, 'Viu dias melhores.', { stack: 1, weapon: 'espada_velha' });
it('espada_aco', 'Espada de Aço', 'weapon', 300, { s: 'sword', c1: '#c8d0d8' }, 'Equilibrada e confiável.', { stack: 1, weapon: 'espada_aco' });
it('espada_cristal', 'Lâmina de Cristal', 'weapon', 900, { s: 'sword', c1: '#9fd8ff' }, 'Corta a escuridão das minas.', { stack: 1, weapon: 'espada_cristal' });
it('adaga', 'Adaga de Caça', 'weapon', 150, { s: 'dagger', c1: '#c8c8c8' }, 'Rápida, mas de curto alcance.', { stack: 1, weapon: 'adaga' });
it('adaga_brasa', 'Adaga de Brasa', 'weapon', 800, { s: 'dagger', c1: '#ff8a3a' }, 'Ainda quente da forja profunda.', { stack: 1, weapon: 'adaga_brasa' });
it('martelo', 'Marreta de Pedreiro', 'weapon', 400, { s: 'hammer', c1: '#8a8a8a' }, 'Lento e devastador.', { stack: 1, weapon: 'martelo' });
it('martelo_lava', 'Martelo Vulcânico', 'weapon', 1600, { s: 'hammer', c1: '#e85a2a' }, 'Faz a terra tremer.', { stack: 1, weapon: 'martelo_lava' });

// ---------- Recursos ----------
it('madeira', 'Madeira', 'resource', 2, { s: 'wood', c1: '#a8743a' }, 'Material básico de construção.');
it('pedra', 'Pedra', 'resource', 2, { s: 'stone', c1: '#9a9a9a' }, 'Útil para caminhos, fornalhas e construções.');
it('fibra', 'Fibra', 'resource', 1, { s: 'fiber', c1: '#7ab04a' }, 'Fios vegetais resistentes.');
it('feno', 'Feno', 'resource', 0, { s: 'hay', c1: '#e8c86a' }, 'Alimento para animais. Fica guardado no silo.');
it('madeira_dura', 'Madeira-de-lei', 'resource', 15, { s: 'wood', c1: '#6a3a1a' }, 'Madeira densa de tocos antigos.');
it('argila', 'Argila', 'resource', 20, { s: 'clay', c1: '#c87a5a' }, 'Desenterrada com a enxada.');
it('seiva', 'Seiva', 'resource', 2, { s: 'drop', c1: '#d8a83a' }, 'Escorre das árvores cortadas.');
it('xarope', 'Xarope de Bordo', 'artisan', 200, { s: 'jar', c1: '#a8541a', c2: '#e8b06a' }, 'Extraído de árvores com o extrator.');
it('resina', 'Resina de Pinheiro', 'artisan', 100, { s: 'jar', c1: '#d8a83a', c2: '#f8e0a0' }, 'Perfumada e pegajosa.');
it('carvao', 'Carvão', 'ore', 15, { s: 'coal', c1: '#2a2a2a' }, 'Combustível para a fornalha.');

// ---------- Minérios e barras ----------
it('min_cobre', 'Minério de Cobre', 'ore', 5, { s: 'ore', c1: '#e08a4a' }, 'Funda em barra de cobre.');
it('min_ferro', 'Minério de Ferro', 'ore', 10, { s: 'ore', c1: '#c8c8d0' }, 'Funda em barra de ferro.');
it('min_ouro', 'Minério de Ouro', 'ore', 25, { s: 'ore', c1: '#f8d03a' }, 'Funda em barra de ouro.');
it('min_astral', 'Minério de Astralita', 'ore', 100, { s: 'ore', c1: '#c87af8' }, 'Um metal que parece conter estrelas.');
it('bar_cobre', 'Barra de Cobre', 'bar', 60, { s: 'bar', c1: '#e08a4a' }, 'Usada em melhorias e máquinas.');
it('bar_ferro', 'Barra de Ferro', 'bar', 120, { s: 'bar', c1: '#c8c8d0' }, 'Usada em melhorias e máquinas.');
it('bar_ouro', 'Barra de Ouro', 'bar', 250, { s: 'bar', c1: '#f8d03a' }, 'Usada em melhorias e máquinas.');
it('bar_astral', 'Barra de Astralita', 'bar', 1000, { s: 'bar', c1: '#c87af8' }, 'O melhor material do vale.');

// ---------- Minerais ----------
it('quartzo', 'Quartzo', 'gem', 25, { s: 'crystal', c1: '#e8e8f0' }, 'Cristal comum e bonito.');
it('ametista', 'Ametista', 'gem', 100, { s: 'gem', c1: '#a85ad8' }, 'Pedra roxa das galerias.');
it('topazio', 'Topázio', 'gem', 80, { s: 'gem', c1: '#f8c03a' }, 'Dourado como mel.');
it('jade', 'Jade', 'gem', 200, { s: 'gem', c1: '#4ab87a' }, 'Verde e frio ao toque.');
it('esmeralda', 'Esmeralda', 'gem', 250, { s: 'gem', c1: '#2ad86a' }, 'Brilho verde intenso.');
it('rubi', 'Rubi', 'gem', 250, { s: 'gem', c1: '#e82a4a' }, 'Vermelho como brasa.');
it('aguamarinha', 'Água-marinha', 'gem', 180, { s: 'gem', c1: '#4ad8e8' }, 'Lembra o mar da enseada.');
it('diamante', 'Diamante', 'gem', 750, { s: 'gem', c1: '#e8f8ff' }, 'Raríssimo e valioso.');
it('pedralua', 'Pedra-da-Lua', 'gem', 300, { s: 'crystal', c1: '#c8d8ff' }, 'Brilha sozinha no escuro.');
it('quartzofogo', 'Quartzo-de-Fogo', 'gem', 100, { s: 'crystal', c1: '#ff7a4a' }, 'Quente ao toque.');

// ---------- Espólios de monstros ----------
it('gel', 'Gosma', 'monster', 5, { s: 'gel', c1: '#6ad84a' }, 'Restos de geleia viva.');
it('asa', 'Asa de Morcego', 'monster', 15, { s: 'wing', c1: '#5a4a6a' }, 'Fina e coriácea.');
it('carapaca', 'Carapaça de Besouro', 'monster', 20, { s: 'shell', c1: '#3a6a5a' }, 'Dura como pedra.');
it('poeira', 'Poeira Estelar', 'monster', 30, { s: 'dust', c1: '#c8d8ff' }, 'Brilha entre os dedos.');
it('essencia', 'Essência Sombria', 'monster', 60, { s: 'orb', c1: '#7a4aa8' }, 'Fria e silenciosa.');
it('cinza', 'Núcleo de Cinzas', 'monster', 120, { s: 'orb', c1: '#e86a2a' }, 'Ainda pulsa como um coração.');

// ---------- Coleta ----------
const forage: [string, string, string, number, number, string][] = [
  ['alhoporo', 'Alho-poró-selvagem', 'long', 60, 0, '#7ab84a'], ['dentedeleao', 'Dente-de-leão', 'flower', 40, 0, '#f8e03a'], ['morel', 'Morela', 'mushroom', 150, 0, '#a8845a'], ['narciso', 'Narciso', 'flower', 30, 0, '#fff0a0'], ['raizforte', 'Raiz-forte', 'long', 50, 0, '#d8c8a0'],
  ['framboesa', 'Framboesa', 'berry', 45, 1, '#e8344a'], ['lirio', 'Lírio-amarelo', 'flower', 70, 1, '#f8c83a'], ['uvamato', 'Uva-do-mato', 'grape', 80, 1, '#5a3a8a'], ['hortela', 'Hortelã', 'herb', 50, 1, '#4ac86a'],
  ['amorasilv', 'Amora-silvestre', 'berry', 20, 2, '#3a1a3a'], ['avela', 'Avelã', 'round', 90, 2, '#a8743a'], ['cogumelo', 'Cogumelo-castanho', 'mushroom', 40, 2, '#c89a6a'], ['ameixamato', 'Ameixa-do-mato', 'round', 85, 2, '#8a3a6a'], ['cogvermelho', 'Cogumelo-vermelho', 'mushroom', 75, 2, '#e83a2a'],
  ['raizinverno', 'Raiz-de-inverno', 'long', 70, 3, '#a87a5a'], ['frutacristal', 'Fruta-de-cristal', 'crystal', 150, 3, '#a8e8ff'], ['azevinho', 'Azevinho', 'berry', 80, 3, '#d82a2a'], ['crocus', 'Crocus-da-neve', 'flower', 60, 3, '#b88ae8'],
];
export const FORAGE_BY_SEASON: string[][] = [[], [], [], []];
for (const [id, name, s, price, season, c] of forage) { it(id, name, 'forage', price, { s, c1: c }, 'Encontrado na natureza.', { quality: true, energy: Math.round(price / 3) }); FORAGE_BY_SEASON[season].push(id); }
it('concha', 'Concha Espiral', 'forage', 35, { s: 'shell', c1: '#f0d8c0' }, 'Achada na areia da praia.', { quality: true });
it('coral', 'Coral', 'forage', 80, { s: 'coral', c1: '#f87a6a' }, 'Pedacinho do recife.', { quality: true });
it('ourico', 'Ouriço-do-mar', 'forage', 160, { s: 'urchin', c1: '#7a3a8a' }, 'Cuidado com os espinhos.', { quality: true });
it('mexilhao', 'Mexilhão', 'forage', 30, { s: 'shell', c1: '#3a3a5a' }, 'Grudado nas pedras.', { quality: true, energy: 10 });
it('alga', 'Alga', 'forage', 20, { s: 'herb', c1: '#3a8a5a' }, 'Pescada sem querer.', { energy: 10 });

// ---------- Lixo ----------
it('bota', 'Bota Velha', 'trash', 0, { s: 'boot', c1: '#6a4a2a' }, 'Ninguém sabe de quem é.');
it('lata', 'Lata Amassada', 'trash', 0, { s: 'can2', c1: '#8a9aa0' }, 'Lixo do rio.');
it('jornal', 'Jornal Encharcado', 'trash', 0, { s: 'paper', c1: '#d8d0b0' }, 'Ilegível.');

// ---------- Produtos animais ----------
it('ovo', 'Ovo', 'animal', 50, { s: 'egg', c1: '#f8f0e0' }, 'Fresquinho do galinheiro.', { quality: true, energy: 15 });
it('ovo_grande', 'Ovo Grande', 'animal', 95, { s: 'egg', c1: '#f8e8c8', c2: 'big' }, 'De uma galinha muito feliz.', { quality: true, energy: 30 });
it('ovo_pato', 'Ovo de Pata', 'animal', 95, { s: 'egg', c1: '#d8e8d0' }, 'Grande e azulado.', { quality: true, energy: 20 });
it('pena', 'Pena de Pato', 'animal', 250, { s: 'feather', c1: '#f0f0f8' }, 'Rara, de uma pata muito contente.', { quality: true });
it('leite', 'Leite', 'animal', 125, { s: 'milk', c1: '#ffffff' }, 'Vira queijo na prensa.', { quality: true, energy: 25 });
it('leite_grande', 'Leite Gordo', 'animal', 190, { s: 'milk', c1: '#fff8e8', c2: 'big' }, 'Cremoso.', { quality: true, energy: 40 });
it('leite_cabra', 'Leite de Cabra', 'animal', 225, { s: 'milk', c1: '#f8f0e0' }, 'Vira queijo de cabra.', { quality: true, energy: 25 });
it('la', 'Lã', 'animal', 340, { s: 'wool', c1: '#f0ece0' }, 'Fofa e quentinha. Vai para o tear.', { quality: true });

// ---------- Artesanais (preço depende do ingrediente) ----------
it('geleia', 'Geleia', 'artisan', 0, { s: 'jar', c1: '#d83a5a' }, 'Fruta conservada no pote.', { quality: false, energy: 30 });
it('conserva', 'Conserva', 'artisan', 0, { s: 'jar', c1: '#7ab04a' }, 'Vegetal em salmoura.', { energy: 30 });
it('vinho', 'Vinho', 'artisan', 0, { s: 'bottle', c1: '#8a1a3a' }, 'Envelhecido no barril.', { quality: true, energy: 20 });
it('suco', 'Suco', 'artisan', 0, { s: 'bottle', c1: '#6ab84a' }, 'Vegetais espremidos no barril.', { energy: 40 });
it('cerveja', 'Cerveja de Trigo', 'artisan', 200, { s: 'mug', c1: '#e8b03a' }, 'Gelada, para o fim do dia.', { energy: 30 });
it('pale', 'Cerveja de Lúpulo', 'artisan', 300, { s: 'mug', c1: '#c88a2a' }, 'Amarga e aromática.', { energy: 30 });
it('queijo', 'Queijo Minas', 'artisan', 230, { s: 'cheese', c1: '#f8e8a0' }, 'Curado na prensa da fazenda.', { quality: true, energy: 50 });
it('queijo_cabra', 'Queijo de Cabra', 'artisan', 400, { s: 'cheese', c1: '#f8f4e0' }, 'Delicado e cremoso.', { quality: true, energy: 50 });
it('maionese', 'Maionese', 'artisan', 190, { s: 'jar', c1: '#f8f0c0' }, 'Batida na máquina.', { quality: true, energy: 20 });
it('maionese_pato', 'Maionese de Pata', 'artisan', 375, { s: 'jar', c1: '#e0f0d0' }, 'Sabor intenso.', { quality: true, energy: 20 });
it('tecido', 'Tecido', 'artisan', 470, { s: 'cloth', c1: '#e8dcc8' }, 'Tecido no tear.', { quality: true });
it('mel', 'Mel Silvestre', 'artisan', 100, { s: 'jar', c1: '#f8b02a' }, 'Das abelheiras da fazenda.', { energy: 25 });
it('farinha', 'Farinha', 'artisan', 50, { s: 'sack', c1: '#f8f0e0' }, 'Moída no moedor.');

// ---------- Comidas ----------
const foods: [string, string, number, number, string, string][] = [
  ['salada', 'Salada da Horta', 113, 110, 'bowl', '#7ad85a'], ['omelete', 'Omelete', 125, 100, 'plate', '#f8d84a'], ['pao', 'Pão Caseiro', 60, 50, 'bread', '#d89a4a'],
  ['panqueca', 'Panqueca', 80, 90, 'plate', '#e8b86a'], ['sopa_abobora', 'Sopa de Abóbora', 300, 200, 'bowl', '#f08a2a'], ['peixe_assado', 'Peixe Assado', 100, 115, 'plate', '#c88a5a'],
  ['ensopado', 'Ensopado de Cogumelos', 200, 150, 'bowl', '#8a6a4a'], ['torta', 'Torta de Frutas', 260, 160, 'pie', '#d84a6a'], ['pizza', 'Pizza da Vila', 300, 150, 'pizza', '#e86a3a'],
  ['moqueca', 'Moqueca', 350, 225, 'bowl', '#e8843a'], ['bolo', 'Bolo de Fubá', 150, 120, 'cake', '#f0c860'], ['refogado', 'Refogado de Couve', 100, 95, 'plate', '#3a8a3a'],
  ['cafe', 'Café Coado', 30, 15, 'mug', '#5a3a1a'], ['pastel', 'Pastel', 60, 70, 'bread', '#f0c070'], ['sopa_dia', 'Sopa do Dia', 90, 120, 'bowl', '#d8a85a'],
  ['doce_leite', 'Doce de Leite', 200, 110, 'jar', '#c8843a'], ['caldo_peixe', 'Caldo de Peixe', 180, 180, 'bowl', '#a8c8d8'], ['tonico', 'Tônico Revigorante', 50, 100, 'potion', '#5ad86a'],
  ['pocao', 'Poção de Cura', 80, 20, 'potion', '#e84a5a'],
];
for (const [id, name, price, energy, s, c] of foods) it(id, name, 'food', price, { s, c1: c }, 'Restaura energia' + (id === 'pocao' ? ' e muita vida.' : ' e vida.'), { energy, hp: id === 'pocao' ? 80 : Math.round(energy * 0.45) });

// ---------- Fertilizantes e iscas ----------
it('adubo', 'Adubo Simples', 'fertilizer', 2, { s: 'sack', c1: '#8a6a3a' }, 'Melhora a chance de colheitas de qualidade.');
it('adubo_q', 'Adubo Nobre', 'fertilizer', 10, { s: 'sack', c1: '#5a3a1a', c2: '#f8d03a' }, 'Grande chance de qualidade ouro.');
it('acelerador', 'Acelerador de Brotos', 'fertilizer', 20, { s: 'sack', c1: '#4a8ad8' }, 'Cultivos crescem 15% mais rápido.');
it('solo_umido', 'Solo Úmido', 'fertilizer', 4, { s: 'sack', c1: '#3a5a8a' }, 'Chance de a terra continuar regada no dia seguinte.');
it('isca', 'Isca de Minhoca', 'bait', 1, { s: 'bait', c1: '#c86a6a' }, 'Os peixes mordem mais rápido.');

// ---------- Fabricáveis / máquinas ----------
const placeables: [string, string, number, string, string, string][] = [
  ['bau', 'Baú', 0, 'chest', '#a8743a', 'Guarda 36 itens.'],
  ['espantalho', 'Espantalho', 0, 'scarecrow', '#c8a05a', 'Protege as plantações num raio de 8 tiles.'],
  ['aspersor', 'Aspersor', 0, 'sprinkler', '#c8c8d0', 'Rega os 4 tiles vizinhos toda manhã.'],
  ['aspersor_q', 'Aspersor de Qualidade', 0, 'sprinkler', '#f8d03a', 'Rega os 8 tiles ao redor toda manhã.'],
  ['aspersor_a', 'Aspersor Astral', 0, 'sprinkler', '#c87af8', 'Rega 24 tiles ao redor toda manhã.'],
  ['tocha', 'Tocha', 1, 'torch', '#f8a83a', 'Ilumina à noite e nas minas.'],
  ['poste', 'Poste de Luz', 50, 'lamp', '#4a4a4a', 'Iluminação elegante para caminhos.'],
  ['cerca', 'Cerca de Madeira', 1, 'fence', '#a8743a', 'Delimita áreas.'],
  ['cerca_pedra', 'Cerca de Pedra', 2, 'fence', '#9a9a9a', 'Mais robusta.'],
  ['caminho_pedra', 'Caminho de Pedra', 1, 'path', '#9a9a9a', 'Piso decorativo. Não cresce mato.'],
  ['caminho_madeira', 'Caminho de Madeira', 1, 'path', '#a8743a', 'Piso decorativo.'],
  ['fornalha', 'Fornalha', 0, 'furnace', '#8a6a5a', 'Funde 5 minérios + 1 carvão em uma barra.'],
  ['conservadora', 'Conservadora', 0, 'jar_m', '#8a6a3a', 'Transforma frutas em geleia e vegetais em conserva.'],
  ['barril', 'Barril', 0, 'keg', '#8a5a2a', 'Fermenta frutas em vinho e vegetais em suco.'],
  ['prensa', 'Prensa de Queijo', 0, 'press', '#c8a87a', 'Transforma leite em queijo.'],
  ['maq_maionese', 'Máquina de Maionese', 0, 'mayo', '#e8e0d0', 'Transforma ovos em maionese.'],
  ['tear', 'Tear', 0, 'loom', '#a8743a', 'Transforma lã em tecido.'],
  ['moedor', 'Moedor', 0, 'mill', '#9a8a7a', 'Transforma trigo em farinha.'],
  ['abelheira', 'Abelheira', 0, 'bee', '#d8b06a', 'Produz mel a cada 4 dias (exceto no inverno).'],
  ['carvoeira', 'Carvoeira', 0, 'kiln', '#6a5a5a', 'Transforma 10 madeiras em carvão.'],
  ['sementeira', 'Sementeira', 0, 'seedmaker', '#7a9a5a', 'Transforma colheitas em sementes.'],
  ['extrator', 'Extrator de Seiva', 0, 'tapper', '#a8743a', 'Coloque numa árvore adulta para colher xarope ou resina.'],
  ['funil', 'Funil de Feno', 0, 'hopper', '#c8a05a', 'Dentro de galinheiros/celeiros: alimenta os animais automaticamente com feno do silo.'],
  ['coletor', 'Coletor Automático', 0, 'grabber', '#8a9aa8', 'Dentro de galinheiros/celeiros: recolhe os produtos dos animais.'],
];
for (const [id, name, price, s, c, desc] of placeables) it(id, name, 'placeable', price, { s, c1: c }, desc, { place: id, stack: 999 });

// ---------- Mobília ----------
const furniture: [string, string, number, string, string][] = [
  ['cadeira', 'Cadeira de Madeira', 300, 'chair', '#a8743a'], ['mesa', 'Mesa Rústica', 750, 'table', '#8a5a2a'], ['tapete', 'Tapete Vermelho', 1200, 'rug', '#b83a3a'],
  ['tapete_verde', 'Tapete de Folhas', 1200, 'rug', '#4a8a4a'], ['vaso', 'Vaso de Samambaia', 400, 'plantpot', '#4a9a3a'], ['quadro', 'Quadro do Vale', 1000, 'painting', '#4a8ad8'],
  ['quadro_mar', 'Quadro da Maré', 1000, 'painting', '#2a6aa8'], ['luminaria', 'Luminária de Pé', 650, 'lampf', '#f8d86a'], ['estante', 'Estante de Livros', 900, 'shelf', '#6a3a1a'],
  ['banco', 'Banco de Jardim', 500, 'bench', '#a8743a'], ['relogio', 'Relógio de Parede', 800, 'clock', '#c8a05a'], ['sofa', 'Sofá Florido', 1500, 'sofa', '#c86a8a'],
];
for (const [id, name, price, s, c] of furniture) it(id, name, 'furniture', Math.round(price / 4), { s, c1: c }, 'Decoração. Posicione em casa ou na fazenda.', { place: id, stack: 99 });

// ---------- Especiais ----------
it('buque', 'Buquê', 'special', 100, { s: 'bouquet', c1: '#f06aa0' }, 'Entregue a alguém especial (8 corações) para começar um namoro.');
it('pingente', 'Pingente das Marés', 'special', 2500, { s: 'pendant', c1: '#4ad8e8' }, 'Um pedido de casamento (10 corações, namorando).');
it('totem_chuva', 'Totem da Chuva', 'special', 50, { s: 'totem', c1: '#4a8ad8' }, 'Use para garantir chuva amanhã.');
it('totem_casa', 'Totem do Retorno', 'special', 50, { s: 'totem', c1: '#8ad84a' }, 'Use para voltar à fazenda instantaneamente.');
it('livro_receitas', 'Caderno de Receitas', 'special', 0, { s: 'scroll', c1: '#e8d8a8' }, 'Ensina uma receita nova.');

// ---------- Gerados: cultivos ----------
for (const c of CROPS) {
  it(c.id, c.name, c.cat, c.sell, { s: c.shape === 'tallflower' ? 'flower' : c.shape === 'stalk' ? 'long' : c.shape, c1: c.color, c2: c.color2 }, c.desc, { quality: true, energy: c.energy || undefined });
  it('sem_' + c.id, c.seedName || 'Sementes de ' + c.name, 'seed', Math.floor(c.seedPrice / 2), { s: 'seed', c1: c.color, c2: c.color2 }, `Plante em ${['primavera', 'verão', 'outono', 'inverno'].filter((_, i) => c.seasons.includes(i)).join(' e ')}. Leva ${c.days} dias.` + (c.regrow ? ` Rebrota a cada ${c.regrow} dia(s).` : ''), { seedOf: c.id });
}
it('sem_inverno', 'Sementes de Inverno', 'seed', 10, { s: 'seed', c1: '#c8d8f0' }, 'Mistura de raízes silvestres. Plante no inverno; vira itens de coleta.', { seedOf: 'misto_inverno' });

// ---------- Gerados: árvores frutíferas ----------
for (const f of FRUIT_TREES) {
  it(f.fruit, f.fruitName, 'fruit', f.sell, { s: 'round', c1: f.color }, `Fruto da ${f.name.toLowerCase()}.`, { quality: true, energy: Math.round(f.sell / 3) });
  it('muda_' + f.id, 'Muda de ' + f.name, 'sapling', Math.floor(f.sapling / 2), { s: 'sapling', c1: f.color }, `Precisa de espaço livre 3x3. Frutifica no ${['primavera', 'verão', 'outono', 'inverno'][f.season]} após 28 dias.`, { sapling: f.id });
}
it('semente_carvalho', 'Bolota', 'sapling', 20, { s: 'acorn', c1: '#a8743a' }, 'Plante para nascer um carvalho.', { sapling: 'carvalho' });
it('semente_bordo', 'Semente de Bordo', 'sapling', 5, { s: 'acorn', c1: '#d8843a' }, 'Plante para nascer um bordo.', { sapling: 'bordo' });
it('semente_pinheiro', 'Pinha', 'sapling', 5, { s: 'acorn', c1: '#6a4a2a' }, 'Plante para nascer um pinheiro.', { sapling: 'pinheiro' });

// ---------- Gerados: peixes ----------
for (const f of FISH) it(f.id, f.name, 'fish', f.price, { s: 'fish_' + (f.shape || 'fish'), c1: f.color, c2: f.color2 }, f.desc, { quality: true, energy: Math.round(f.price / 4) });

export function itemDef(id: string): ItemDef {
  const d = ITEMS[id];
  if (!d) throw new Error('Item desconhecido: ' + id);
  return d;
}

/** Preço de artesanais derivado do ingrediente. */
export function artisanPrice(id: string, ref?: string): number {
  if (!ref) return ITEMS[id]?.price || 0;
  const base = ITEMS[ref]?.price || 0;
  switch (id) {
    case 'geleia': case 'conserva': return 2 * base + 50;
    case 'vinho': return Math.round(base * 3);
    case 'suco': return Math.round(base * 2.25);
    case 'sem_': return 0;
  }
  return ITEMS[id].price;
}

export function itemName(id: string, ref?: string) {
  const d = ITEMS[id];
  if (!d) return id;
  if (ref && ITEMS[ref]) {
    const rn = ITEMS[ref].name;
    if (id === 'geleia') return 'Geleia de ' + rn;
    if (id === 'conserva') return 'Conserva de ' + rn;
    if (id === 'vinho') return 'Vinho de ' + rn;
    if (id === 'suco') return 'Suco de ' + rn;
  }
  return d.name;
}

export const QUALITY_NAMES = ['Normal', 'Prata', 'Ouro', 'Astral'];
export const QUALITY_MULT = [1, 1.25, 1.5, 2];
