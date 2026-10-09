// Espécies de peixes. Horário em minutos do dia (360 = 06:00, 1560 = 02:00).
import type { FishZone } from '../world/types';

export type FishBehavior = 'suave' | 'misto' | 'afunda' | 'flutua' | 'dardo';
export type Weather = 'any' | 'sol' | 'chuva';

export interface FishDef {
  id: string; name: string; zones: FishZone[]; seasons: number[]; from: number; to: number; weather: Weather;
  difficulty: number; behavior: FishBehavior; price: number; rarity: number; color: string; color2: string; shape?: 'fish' | 'long' | 'flat' | 'octo' | 'squid' | 'puffer';
  minLevel?: number; legendary?: boolean; mineLevel?: number; desc: string;
}

const D = 360, N = 1560; // dia inteiro
export const FISH: FishDef[] = [
  // RIO
  { id: 'lambari', name: 'Lambari', zones: ['rio'], seasons: [0, 1, 2], from: D, to: 1140, weather: 'any', difficulty: 25, behavior: 'suave', price: 30, rarity: 0.9, color: '#c8d0d8', color2: '#e8a03a', desc: 'Pequeno, prateado e abundante.' },
  { id: 'piaba', name: 'Piaba', zones: ['rio', 'lagoa'], seasons: [0, 1, 2, 3], from: D, to: N, weather: 'any', difficulty: 18, behavior: 'suave', price: 20, rarity: 1, color: '#a8b8a0', color2: '#d8d8b0', desc: 'O primeiro peixe de muita gente.' },
  { id: 'truta', name: 'Truta-arco-íris', zones: ['rio'], seasons: [1], from: D, to: 1140, weather: 'sol', difficulty: 45, behavior: 'misto', price: 65, rarity: 0.6, color: '#8aa870', color2: '#e86a8a', desc: 'Faixa colorida brilhando no verão.' },
  { id: 'dourado', name: 'Dourado-do-rio', zones: ['rio'], seasons: [1, 2], from: 600, to: 1140, weather: 'any', difficulty: 70, behavior: 'dardo', price: 150, rarity: 0.3, color: '#f0b82a', color2: '#d88a1a', desc: 'Briguento e reluzente.' },
  { id: 'bagre', name: 'Bagre', zones: ['rio', 'lagoa'], seasons: [0, 1, 2], from: D, to: N, weather: 'chuva', difficulty: 60, behavior: 'misto', price: 200, rarity: 0.35, color: '#6a6a5a', color2: '#3a3a2a', desc: 'Só morde quando o rio está agitado de chuva.' },
  { id: 'traira', name: 'Traíra', zones: ['rio', 'lagoa'], seasons: [2, 3], from: 1080, to: N, weather: 'any', difficulty: 55, behavior: 'afunda', price: 90, rarity: 0.5, color: '#5a5a3a', color2: '#8a8a4a', desc: 'Caçadora noturna de dentes afiados.' },
  { id: 'tilapia', name: 'Tilápia', zones: ['rio', 'lagoa'], seasons: [1, 2], from: 600, to: 1200, weather: 'any', difficulty: 30, behavior: 'suave', price: 75, rarity: 0.7, color: '#9aa0a8', color2: '#5a6a7a', desc: 'Resistente e saborosa.' },
  { id: 'salmao', name: 'Salmão-pintado', zones: ['rio'], seasons: [2], from: D, to: 1140, weather: 'any', difficulty: 50, behavior: 'misto', price: 80, rarity: 0.6, color: '#d87a5a', color2: '#8a4a3a', desc: 'Sobe o rio no outono.' },
  { id: 'pacu', name: 'Pacu', zones: ['rio'], seasons: [1], from: 720, to: 1260, weather: 'any', difficulty: 40, behavior: 'flutua', price: 90, rarity: 0.5, color: '#7a8a9a', color2: '#d86a3a', desc: 'Adora frutas que caem na água.' },
  { id: 'enguia', name: 'Enguia-do-brejo', zones: ['rio', 'lagoa'], seasons: [0, 2], from: 960, to: N, weather: 'chuva', difficulty: 70, behavior: 'afunda', price: 85, rarity: 0.4, color: '#5a4a2a', color2: '#3a2a1a', shape: 'long', desc: 'Escorregadia como sabão.' },
  { id: 'reiribeirao', name: 'Rei-do-Ribeirão', zones: ['rio'], seasons: [0], from: D, to: 1200, weather: 'chuva', difficulty: 95, behavior: 'dardo', price: 1500, rarity: 0.04, color: '#f0d050', color2: '#c84a2a', legendary: true, minLevel: 5, desc: 'Lenda da vila: dizem que guarda o rio.' },
  // LAGO (montanha)
  { id: 'carpa', name: 'Carpa', zones: ['lago', 'lagoa'], seasons: [0, 1, 2, 3], from: D, to: N, weather: 'any', difficulty: 15, behavior: 'suave', price: 30, rarity: 1, color: '#9a8a5a', color2: '#7a6a3a', desc: 'Comum em qualquer água parada.' },
  { id: 'tucunare', name: 'Tucunaré-azul', zones: ['lago'], seasons: [0, 2], from: 360, to: 1140, weather: 'any', difficulty: 50, behavior: 'misto', price: 100, rarity: 0.5, color: '#4a8ab8', color2: '#f0d040', desc: 'Tem um olho falso no rabo.' },
  { id: 'percalunar', name: 'Perca-lunar', zones: ['lago'], seasons: [3], from: 1080, to: N, weather: 'any', difficulty: 55, behavior: 'flutua', price: 120, rarity: 0.45, color: '#d0d8f0', color2: '#8a9ad8', desc: 'Só aparece sob a lua de inverno.' },
  { id: 'luciosombrio', name: 'Lúcio-sombrio', zones: ['lago'], seasons: [3], from: D, to: 1200, weather: 'any', difficulty: 60, behavior: 'dardo', price: 110, rarity: 0.4, color: '#3a4a5a', color2: '#6a7a6a', desc: 'Espreita sob o gelo.' },
  { id: 'esturjao', name: 'Esturjão-de-pedra', zones: ['lago'], seasons: [1, 3], from: D, to: 1140, weather: 'any', difficulty: 78, behavior: 'misto', price: 200, rarity: 0.25, color: '#6a7a7a', color2: '#4a5a5a', desc: 'Antigo como as montanhas.' },
  { id: 'velhaescama', name: 'Velha Escama', zones: ['lago'], seasons: [3], from: 360, to: 840, weather: 'sol', difficulty: 100, behavior: 'afunda', price: 2000, rarity: 0.03, color: '#8ad0c0', color2: '#4a7a8a', legendary: true, minLevel: 6, desc: 'Ninguém a vê há quarenta invernos.' },
  // MAR
  { id: 'sardinha', name: 'Sardinha', zones: ['mar'], seasons: [0, 2, 3], from: D, to: 1140, weather: 'any', difficulty: 20, behavior: 'suave', price: 40, rarity: 1, color: '#9ab0c8', color2: '#5a7a9a', desc: 'Nada em cardumes enormes.' },
  { id: 'anchova', name: 'Anchova', zones: ['mar'], seasons: [0, 2], from: D, to: N, weather: 'any', difficulty: 30, behavior: 'dardo', price: 30, rarity: 0.9, color: '#8aa0b0', color2: '#c8d8e0', desc: 'Pequena e nervosa.' },
  { id: 'atum', name: 'Atum-listrado', zones: ['mar'], seasons: [1, 3], from: D, to: 1140, weather: 'any', difficulty: 70, behavior: 'misto', price: 100, rarity: 0.4, color: '#3a5a8a', color2: '#c8d0e0', desc: 'Forte e veloz.' },
  { id: 'linguado', name: 'Linguado', zones: ['mar'], seasons: [0, 1], from: D, to: 1200, weather: 'any', difficulty: 50, behavior: 'afunda', price: 100, rarity: 0.5, color: '#b0a07a', color2: '#7a6a4a', shape: 'flat', desc: 'Os dois olhos do mesmo lado.' },
  { id: 'robalo', name: 'Robalo', zones: ['mar', 'enseada'], seasons: [0, 1, 2, 3], from: D, to: N, weather: 'any', difficulty: 40, behavior: 'misto', price: 75, rarity: 0.7, color: '#a0a8b0', color2: '#4a4a5a', desc: 'Presente o ano inteiro.' },
  { id: 'garoupa', name: 'Garoupa', zones: ['mar'], seasons: [1, 2], from: 600, to: 1200, weather: 'any', difficulty: 60, behavior: 'afunda', price: 140, rarity: 0.35, color: '#a85a3a', color2: '#f0c8a0', desc: 'Grandona e preguiçosa... até morder.' },
  { id: 'polvo', name: 'Polvo-coral', zones: ['mar'], seasons: [1], from: 360, to: 780, weather: 'any', difficulty: 95, behavior: 'flutua', price: 150, rarity: 0.12, color: '#e86a5a', color2: '#f8b0a0', shape: 'octo', desc: 'Oito braços, todos teimosos.' },
  { id: 'lula', name: 'Lula-de-vidro', zones: ['mar'], seasons: [3], from: 1080, to: N, weather: 'any', difficulty: 75, behavior: 'flutua', price: 80, rarity: 0.4, color: '#e0e8f0', color2: '#b0c8e0', shape: 'squid', desc: 'Quase transparente.' },
  { id: 'arraia', name: 'Arraia-pintada', zones: ['mar'], seasons: [1], from: D, to: N, weather: 'chuva', difficulty: 70, behavior: 'flutua', price: 180, rarity: 0.3, color: '#5a6a8a', color2: '#e8e8f0', shape: 'flat', desc: 'Desliza pelas ondas de chuva.' },
  { id: 'agulha', name: 'Peixe-agulha', zones: ['mar'], seasons: [2], from: D, to: 1200, weather: 'any', difficulty: 55, behavior: 'dardo', price: 90, rarity: 0.45, color: '#7ab0a0', color2: '#3a7a6a', shape: 'long', desc: 'Fino como uma agulha de tricô.' },
  { id: 'baiacu', name: 'Baiacu', zones: ['mar'], seasons: [1], from: 720, to: 960, weather: 'sol', difficulty: 80, behavior: 'flutua', price: 200, rarity: 0.25, color: '#e8d07a', color2: '#8a7a3a', shape: 'puffer', desc: 'Incha quando se irrita.' },
  { id: 'cavala', name: 'Cavala', zones: ['mar'], seasons: [2, 3], from: D, to: 1140, weather: 'any', difficulty: 45, behavior: 'misto', price: 70, rarity: 0.6, color: '#4a7a9a', color2: '#2a4a5a', desc: 'Listrada e cheia de energia.' },
  // MINAS
  { id: 'peixepedra', name: 'Peixe-pedra', zones: ['mina'], seasons: [0, 1, 2, 3], from: D, to: N, weather: 'any', difficulty: 65, behavior: 'afunda', price: 300, rarity: 0.5, color: '#8a8a8a', color2: '#5a5a5a', mineLevel: 20, desc: 'Parece uma pedra com barbatanas.' },
  { id: 'fantasma', name: 'Peixe-fantasma', zones: ['mina'], seasons: [0, 1, 2, 3], from: D, to: N, weather: 'any', difficulty: 50, behavior: 'misto', price: 45, rarity: 0.7, color: '#e8e8f0', color2: '#c0c0d8', mineLevel: 40, desc: 'Pálido de nunca ver o sol.' },
  { id: 'enguiacristal', name: 'Enguia-de-cristal', zones: ['mina'], seasons: [0, 1, 2, 3], from: D, to: N, weather: 'any', difficulty: 80, behavior: 'dardo', price: 500, rarity: 0.4, color: '#9fd8ff', color2: '#5a9ad8', shape: 'long', mineLevel: 60, desc: 'Reflete a luz dos cristais.' },
  // ENSEADA (região secreta)
  { id: 'lanterna', name: 'Peixe-lanterna', zones: ['enseada'], seasons: [0, 1, 2, 3], from: 1080, to: N, weather: 'any', difficulty: 60, behavior: 'flutua', price: 250, rarity: 0.5, color: '#3a3a6a', color2: '#f8f07a', desc: 'Carrega a própria luz.' },
  { id: 'cavalomarinho', name: 'Cavalo-marinho-dourado', zones: ['enseada'], seasons: [1, 2], from: D, to: 1140, weather: 'any', difficulty: 70, behavior: 'misto', price: 400, rarity: 0.3, color: '#f0c040', color2: '#c88a1a', desc: 'Raro e elegante.' },
  { id: 'dragaodasmares', name: 'Dragão-das-Marés', zones: ['enseada'], seasons: [0, 1, 2, 3], from: D, to: N, weather: 'chuva', difficulty: 105, behavior: 'dardo', price: 3000, rarity: 0.03, color: '#3ab8a0', color2: '#f0d04a', legendary: true, minLevel: 8, shape: 'long', desc: 'O guardião da enseada esquecida.' },
];

export const FISH_BY_ID: Record<string, FishDef> = Object.fromEntries(FISH.map(f => [f.id, f]));
