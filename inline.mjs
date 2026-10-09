// Gera dist/vale-candeia.html (jogo em um único arquivo) a partir de dist/main.js.
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const js = readFileSync('dist/main.js', 'utf8').replace(/<\/script/g, '<\\/script');
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vale da Candeia</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>html,body{background:#120c0a;margin:0;height:100%;overflow:hidden}</style>
</head>
<body>
<script type="module">
${js}
</script>
</body>
</html>
`;
mkdirSync('dist', { recursive: true });
writeFileSync('dist/vale-candeia.html', html);
console.log('ok', (html.length / 1024).toFixed(0) + ' KB');
