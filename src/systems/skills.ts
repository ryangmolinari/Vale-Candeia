// Habilidades, XP, níveis e especializações.
import { getState } from '../state/state';
import { bus } from '../core/util';

export type SkillId = 'farming' | 'mining' | 'fishing' | 'foraging' | 'combat';
export const SKILL_NAMES: Record<SkillId, string> = { farming: 'Agricultura', mining: 'Mineração', fishing: 'Pesca', foraging: 'Coleta', combat: 'Combate' };
export const XP_TABLE = [100, 380, 770, 1300, 2150, 3300, 4800, 6900, 10000, 15000];

export interface Prof { id: string; name: string; desc: string }
export const PROFS: Record<SkillId, { 5: [Prof, Prof]; 10: [Prof, Prof] }> = {
  farming: { 5: [{ id: 'lavrador', name: 'Lavrador', desc: 'Colheitas valem 10% a mais.' }, { id: 'criador', name: 'Criador', desc: 'Produtos animais valem 20% a mais.' }], 10: [{ id: 'artesao', name: 'Artesão', desc: 'Produtos artesanais valem 40% a mais.' }, { id: 'agronomo', name: 'Agrônomo', desc: 'Cultivos crescem 10% mais rápido.' }] },
  mining: { 5: [{ id: 'minerador', name: 'Minerador', desc: '+1 minério por rocha de minério.' }, { id: 'geologo', name: 'Geólogo', desc: 'Chance dobrada de encontrar gemas.' }], 10: [{ id: 'gemologo', name: 'Gemólogo', desc: 'Minerais valem 30% a mais.' }, { id: 'prospector', name: 'Prospector', desc: 'Escadas aparecem com mais frequência.' }] },
  fishing: { 5: [{ id: 'pescador', name: 'Pescador', desc: 'Peixes valem 25% a mais.' }, { id: 'paciente', name: 'Paciente', desc: 'Barra de captura 20% maior.' }], 10: [{ id: 'angler', name: 'Mestre do Anzol', desc: 'Peixes valem 50% a mais.' }, { id: 'mestre', name: 'Linha Firme', desc: 'A captura escapa bem mais devagar.' }] },
  foraging: { 5: [{ id: 'coletor', name: 'Coletor', desc: 'Itens de coleta valem 20% a mais.' }, { id: 'lenhador', name: 'Lenhador', desc: 'Árvores rendem 25% mais madeira.' }], 10: [{ id: 'botanico', name: 'Botânico', desc: 'Itens de coleta sempre com qualidade Ouro.' }, { id: 'rastreador', name: 'Rastreador', desc: 'Mais itens de coleta aparecem no mundo.' }] },
  combat: { 5: [{ id: 'guerreiro', name: 'Guerreiro', desc: '+15% de dano.' }, { id: 'defensor', name: 'Defensor', desc: '+25 de vida máxima.' }], 10: [{ id: 'berserker', name: 'Berserker', desc: 'Chance de crítico dobrada.' }, { id: 'acrobata', name: 'Acrobata', desc: 'Golpes 25% mais rápidos.' }] },
};

export function level(sk: SkillId) { return getState().skills[sk].level; }
export function hasProf(id: string) { const s = getState(); return Object.values(s.skills).some(x => x.profs.includes(id)); }

export function addXP(sk: SkillId, amt: number) {
  const s = getState();
  const st = s.skills[sk];
  if (st.level >= 10) return;
  st.xp += amt;
  while (st.level < 10 && st.xp >= XP_TABLE[st.level]) {
    st.level++;
    s.pendingLevelUps.push({ skill: sk, level: st.level });
    if (sk === 'combat') { s.player.maxHp += 5; }
    bus.emit('levelUp', sk, st.level);
  }
}

/** Custo de energia de ferramenta, reduzido pelo nível. */
export function toolEnergy(tool: string, base = 2) {
  const map: Record<string, SkillId> = { hoe: 'farming', can: 'farming', pick: 'mining', axe: 'foraging', rod: 'fishing', scythe: 'farming' };
  const sk = map[tool];
  const lv = sk ? level(sk) : 0;
  return Math.max(0.5, base - lv * 0.1);
}
