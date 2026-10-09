// Paletas sazonais e de biomas.

export interface SeasonPal {
  grass: string; grassDark: string; grassLight: string; tuft: string; flowers: string[];
  leaf: string; leafDark: string; leafLight: string; water: string; waterDeep: string; dirt: string;
}

export const SEASON_PAL: SeasonPal[] = [
  { // primavera
    grass: '#6fb04a', grassDark: '#4f8f3a', grassLight: '#8fca5a', tuft: '#3f7a32', flowers: ['#f7e86a', '#f4a2c8', '#ffffff', '#a6c8ff'],
    leaf: '#5aa83f', leafDark: '#3d7d31', leafLight: '#84c853', water: '#3f8fd0', waterDeep: '#2c6eb0', dirt: '#a7774a',
  },
  { // verão
    grass: '#4f9e35', grassDark: '#3a7e2a', grassLight: '#73bd44', tuft: '#2e6a24', flowers: ['#ffd23f', '#ff6b4a', '#c56bff'],
    leaf: '#3f9332', leafDark: '#2b6c25', leafLight: '#68b545', water: '#3a92cc', waterDeep: '#256ea8', dirt: '#a5714a',
  },
  { // outono
    grass: '#a39a45', grassDark: '#7f7a36', grassLight: '#c0b45a', tuft: '#6c6530', flowers: ['#e9893a', '#c94b2a', '#f2c14e'],
    leaf: '#d9822e', leafDark: '#a85424', leafLight: '#f2b04a', water: '#3c7fae', waterDeep: '#2a5f8c', dirt: '#9c6a42',
  },
  { // inverno
    grass: '#e8eef6', grassDark: '#c4d2e4', grassLight: '#ffffff', tuft: '#b3c3d9', flowers: ['#d9e6f7'],
    leaf: '#7a6a58', leafDark: '#5a4c3f', leafLight: '#9a8a74', water: '#4d7fa8', waterDeep: '#3a668e', dirt: '#8a6a52',
  },
];

export interface BiomePal { floor: string; floorAlt: string; wall: string; wallTop: string; accent: string; name: string; }
export const BIOMES: BiomePal[] = [
  { name: 'Galerias de Terra', floor: '#8a6a4a', floorAlt: '#7a5c3f', wall: '#5c4632', wallTop: '#7e6248', accent: '#b08a5a' },
  { name: 'Grutas Úmidas', floor: '#4f6a5f', floorAlt: '#435a52', wall: '#2f4440', wallTop: '#4a6a60', accent: '#7fb8a0' },
  { name: 'Salões de Cristal', floor: '#4a5a8a', floorAlt: '#3f4d78', wall: '#2c3560', wallTop: '#4a5a92', accent: '#9fd8ff' },
  { name: 'Fornalha Profunda', floor: '#6a3a32', floorAlt: '#5a302a', wall: '#3a1e1c', wallTop: '#6a2e26', accent: '#ff8a3a' },
];

export const UI = {
  wood: '#8a5a32', woodDark: '#5c3a1e', woodLight: '#b07a46', parchment: '#f4e2b8', parchDark: '#d9bf8a', ink: '#4a2e1a',
};
