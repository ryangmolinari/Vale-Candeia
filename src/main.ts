// Ponto de entrada.
import { boot } from './game';

function start() {
  const go = () => boot();
  const f = (document as any).fonts;
  if (f && f.load) Promise.race([f.load('16px "Pixelify Sans"'), new Promise(r => setTimeout(r, 1500))]).then(go, go);
  else go();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
