// Definições de cultivos (data-driven). Estações: 0 primavera, 1 verão, 2 outono, 3 inverno.

export type CropShape = 'bulb' | 'long' | 'leafy' | 'round' | 'berry' | 'corn' | 'grain' | 'flower' | 'pumpkin' | 'melon' | 'grape' | 'pepper' | 'stalk' | 'tallflower' | 'pod' | 'eggplant';

export interface CropDef {
  id: string; name: string; seasons: number[]; days: number; seedPrice: number; sell: number;
  regrow?: number; extra?: number; multi?: number; shape: CropShape; color: string; color2?: string; leaf?: string;
  cat: 'crop' | 'fruit' | 'flower'; energy: number; scythe?: boolean; giant?: boolean; seedName?: string; shop?: boolean;
  desc: string;
}

export const CROPS: CropDef[] = [
  // PRIMAVERA
  { id: 'nabo', name: 'Nabo-roxo', seasons: [0], days: 4, seedPrice: 20, sell: 35, shape: 'bulb', color: '#f2e6f0', color2: '#a35ac0', cat: 'crop', energy: 20, desc: 'Raiz rápida e confiável. Todo fazendeiro começa com ela.' },
  { id: 'rabanete', name: 'Rabanete', seasons: [0], days: 3, seedPrice: 15, sell: 27, shape: 'bulb', color: '#e2384a', color2: '#ffffff', cat: 'crop', energy: 15, desc: 'Picante e crocante.' },
  { id: 'alface', name: 'Alface-crespa', seasons: [0], days: 5, seedPrice: 30, sell: 55, shape: 'leafy', color: '#9edc6a', cat: 'crop', energy: 18, desc: 'Folhas frescas e onduladas.' },
  { id: 'batata', name: 'Batata', seasons: [0], days: 6, seedPrice: 50, sell: 80, extra: 0.25, shape: 'round', color: '#c8995a', cat: 'crop', energy: 25, desc: 'Às vezes vem mais de uma por cova.' },
  { id: 'couve', name: 'Couve-manteiga', seasons: [0], days: 6, seedPrice: 70, sell: 110, shape: 'leafy', color: '#3f8a46', cat: 'crop', energy: 25, desc: 'Folhas largas, ótimas refogadas.' },
  { id: 'alho', name: 'Alho', seasons: [0], days: 4, seedPrice: 40, sell: 60, shape: 'bulb', color: '#f4efe0', color2: '#d8c8b0', cat: 'crop', energy: 8, desc: 'Perfuma qualquer panela da vila.' },
  { id: 'morango', name: 'Morango', seasons: [0], days: 8, seedPrice: 100, sell: 60, regrow: 4, shape: 'berry', color: '#ea3a4a', cat: 'fruit', energy: 30, shop: false, desc: 'Vendido apenas na Festa das Sementes. Produz várias vezes.' },
  { id: 'feijao', name: 'Feijão-verde', seasons: [0], days: 10, seedPrice: 60, sell: 40, regrow: 3, shape: 'pod', color: '#6ac04a', cat: 'crop', energy: 15, desc: 'Vagem comprida que volta a produzir.' },
  { id: 'tulipa', name: 'Tulipa', seasons: [0], days: 6, seedPrice: 20, sell: 30, shape: 'flower', color: '#f06aa0', cat: 'flower', energy: 10, desc: 'A flor favorita da primavera.' },
  { id: 'ruibarbo', name: 'Ruibarbo', seasons: [0], days: 13, seedPrice: 100, sell: 220, shape: 'stalk', color: '#d83a5a', cat: 'fruit', energy: 0, shop: false, desc: 'Talos ácidos e valiosos. Vendido pelo comerciante itinerante.' },
  // VERÃO
  { id: 'tomate', name: 'Tomate', seasons: [1], days: 11, seedPrice: 50, sell: 60, regrow: 4, shape: 'round', color: '#e23a2a', cat: 'crop', energy: 20, desc: 'Vermelho, suculento e generoso.' },
  { id: 'milho', name: 'Milho', seasons: [1, 2], days: 14, seedPrice: 150, sell: 50, regrow: 4, shape: 'corn', color: '#f4d03a', cat: 'crop', energy: 25, desc: 'Cresce do verão até o fim do outono.' },
  { id: 'melao', name: 'Melão-cantalupo', seasons: [1], days: 12, seedPrice: 80, sell: 250, shape: 'melon', color: '#e8c070', color2: '#c89a50', cat: 'fruit', energy: 45, giant: true, desc: 'Doce e perfumado. Pode crescer gigante.' },
  { id: 'pimenta', name: 'Pimenta-de-cheiro', seasons: [1], days: 5, seedPrice: 40, sell: 40, regrow: 3, shape: 'pepper', color: '#f04a2a', cat: 'fruit', energy: 5, desc: 'Arde só um pouquinho.' },
  { id: 'mirtilo', name: 'Mirtilo', seasons: [1], days: 13, seedPrice: 80, sell: 50, regrow: 4, multi: 3, shape: 'berry', color: '#4a5ad8', cat: 'fruit', energy: 25, desc: 'Cachos generosos a cada colheita.' },
  { id: 'girassol', name: 'Girassol', seasons: [1, 2], days: 8, seedPrice: 200, sell: 80, shape: 'tallflower', color: '#ffd23a', color2: '#6a3a1a', cat: 'flower', energy: 15, desc: 'Sempre olhando para o sol.' },
  { id: 'trigo', name: 'Trigo', seasons: [1, 2], days: 4, seedPrice: 10, sell: 25, shape: 'grain', color: '#e8c060', cat: 'crop', energy: 0, scythe: true, desc: 'Colhido com a foice. Vira farinha ou cerveja.' },
  { id: 'abobrinha', name: 'Abobrinha', seasons: [1], days: 8, seedPrice: 45, sell: 70, shape: 'long', color: '#5aa84a', cat: 'crop', energy: 18, desc: 'Cresce rápido no calor.' },
  { id: 'maracuja', name: 'Maracujá', seasons: [1], days: 12, seedPrice: 90, sell: 65, regrow: 3, shape: 'round', color: '#7a3a8a', cat: 'fruit', energy: 20, desc: 'Azedinho e calmante.' },
  { id: 'lupulo', name: 'Lúpulo', seasons: [1], days: 11, seedPrice: 60, sell: 25, regrow: 1, shape: 'berry', color: '#9ad85a', cat: 'crop', energy: 10, desc: 'Produz todos os dias depois de maduro.' },
  // OUTONO
  { id: 'abobora', name: 'Abóbora', seasons: [2], days: 13, seedPrice: 100, sell: 320, shape: 'pumpkin', color: '#f08a2a', cat: 'crop', energy: 35, giant: true, desc: 'A rainha do outono. Pode crescer gigante.' },
  { id: 'uva', name: 'Uva', seasons: [2], days: 10, seedPrice: 60, sell: 80, regrow: 3, shape: 'grape', color: '#7a3aa8', cat: 'fruit', energy: 15, desc: 'Vira um vinho excelente.' },
  { id: 'berinjela', name: 'Berinjela', seasons: [2], days: 5, seedPrice: 20, sell: 60, regrow: 5, shape: 'eggplant', color: '#5a2a7a', cat: 'crop', energy: 20, desc: 'Brilhante e roxa.' },
  { id: 'beterraba', name: 'Beterraba', seasons: [2], days: 6, seedPrice: 20, sell: 100, shape: 'bulb', color: '#8a1a3a', color2: '#5a8a3a', cat: 'crop', energy: 20, desc: 'Terrosa e adocicada.' },
  { id: 'batatadoce', name: 'Batata-doce', seasons: [2], days: 7, seedPrice: 60, sell: 100, shape: 'long', color: '#b84a5a', cat: 'crop', energy: 30, desc: 'Assada no fogão a lenha, não tem igual.' },
  { id: 'amora', name: 'Amora', seasons: [2], days: 7, seedPrice: 240, sell: 75, regrow: 5, multi: 2, shape: 'berry', color: '#4a1a3a', cat: 'fruit', energy: 15, desc: 'Dá duas por vez e volta a produzir.' },
  { id: 'inhame', name: 'Inhame', seasons: [2], days: 10, seedPrice: 60, sell: 160, shape: 'long', color: '#a87a5a', cat: 'crop', energy: 30, desc: 'Raiz grande e nutritiva.' },
  { id: 'brocolis', name: 'Brócolis', seasons: [2], days: 8, seedPrice: 70, sell: 130, shape: 'leafy', color: '#2f7a3a', cat: 'crop', energy: 25, desc: 'Arvorezinhas verdes.' },
  { id: 'alcachofra', name: 'Alcachofra', seasons: [2], days: 8, seedPrice: 80, sell: 160, shape: 'leafy', color: '#6a9a6a', color2: '#8a5a9a', cat: 'crop', energy: 15, desc: 'Exótica, chegou à vila pelo comerciante.' },
  { id: 'cenoura', name: 'Cenoura', seasons: [2], days: 6, seedPrice: 40, sell: 75, shape: 'long', color: '#f07a2a', cat: 'crop', energy: 20, desc: 'Laranja como as folhas do outono.' },
  // INVERNO / ESPECIAIS
  { id: 'cebolaneve', name: 'Cebola-de-neve', seasons: [3], days: 7, seedPrice: 90, sell: 140, shape: 'bulb', color: '#e8f0ff', color2: '#7ab0d8', cat: 'crop', energy: 15, shop: false, desc: 'Uma das poucas plantas que suportam a geada.' },
  { id: 'liriolunar', name: 'Lírio-lunar', seasons: [0, 1, 2], days: 18, seedPrice: 500, sell: 900, shape: 'flower', color: '#bfe0ff', cat: 'flower', energy: 0, shop: false, desc: 'Brilha fracamente à noite. Raríssimo.' },
];

export const CROP_BY_ID: Record<string, CropDef> = Object.fromEntries(CROPS.map(c => [c.id, c]));

/** Quantidade de estágios visuais antes do maduro. */
export const CROP_STAGES = 4;
export function cropStage(c: CropDef, grown: number) {
  if (grown >= c.days) return CROP_STAGES; // maduro
  return Math.min(CROP_STAGES - 1, Math.floor((grown / c.days) * CROP_STAGES));
}

/** Árvores frutíferas (mudas compradas na Venda). */
export interface FruitTreeDef { id: string; name: string; season: number; fruit: string; fruitName: string; color: string; sell: number; sapling: number; }
export const FRUIT_TREES: FruitTreeDef[] = [
  { id: 'cerejeira', name: 'Cerejeira', season: 0, fruit: 'cereja', fruitName: 'Cereja', color: '#d82a3a', sell: 80, sapling: 3400 },
  { id: 'damasqueiro', name: 'Damasqueiro', season: 0, fruit: 'damasco', fruitName: 'Damasco', color: '#f4a24a', sell: 50, sapling: 2000 },
  { id: 'laranjeira', name: 'Laranjeira', season: 1, fruit: 'laranja', fruitName: 'Laranja', color: '#f48a1a', sell: 100, sapling: 4000 },
  { id: 'pessegueiro', name: 'Pessegueiro', season: 1, fruit: 'pessego', fruitName: 'Pêssego', color: '#f8a88a', sell: 140, sapling: 6000 },
  { id: 'macieira', name: 'Macieira', season: 2, fruit: 'maca', fruitName: 'Maçã', color: '#d8342a', sell: 100, sapling: 4000 },
  { id: 'romazeira', name: 'Romãzeira', season: 2, fruit: 'roma', fruitName: 'Romã', color: '#b81a3a', sell: 140, sapling: 6000 },
];
