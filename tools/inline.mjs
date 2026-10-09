// Gera dist/vale-candeia.html (arquivo único) e dist/artifact.html (sem esqueleto, para publicação).
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
const html = readFileSync('index.html', 'utf8');
const js = readFileSync('dist/main.js', 'utf8').replace(/<\/script/g, '<\\/script');
copyFileSync('index.html', 'dist/index.html');
const single = html.replace('<script type="module" src="./main.js"></script>', `<script type="module">\n${js}\n</script>`);
writeFileSync('dist/vale-candeia.html', single);
const art = `<title>Vale da Candeia</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>:root{--bg:#120c0a;color-scheme:dark;padding:0!important}html,body{background:var(--bg);margin:0;height:100%;overflow:hidden}</style>
<script type="module">
${js}
</script>
`;
writeFileSync('dist/artifact.html', art);
console.log('ok', (single.length / 1024).toFixed(0) + ' KB');
