// Unisce client/styles.css, client/body.html e client/js/*.js (in ordine numerico) in un unico file.
// Uso: node tools/build.js        -> dist/index.html (pagina completa, per il server)
//                                    dist/artifact.html (formato per l'anteprima su claude.ai)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), c = p => path.join(root, 'client', p);
const css = fs.readFileSync(c('styles.css'), 'utf8');
const body = fs.readFileSync(c('body.html'), 'utf8');
const mapimg = 'const MAPIMG=' + JSON.stringify(Object.fromEntries(fs.readdirSync(c('assets/maps')).filter(f => f.endsWith('.webp')).map(f => [f.replace('.webp',''), 'data:image/webp;base64,' + fs.readFileSync(c('assets/maps/' + f)).toString('base64')]))) + ';\n';
const portimg = 'const PORTIMG=' + JSON.stringify(Object.fromEntries(fs.readdirSync(c('assets/ritratti')).filter(f => f.endsWith('.webp')).map(f => [f.replace('.webp',''), 'data:image/webp;base64,' + fs.readFileSync(c('assets/ritratti/' + f)).toString('base64')]))) + ';\n';
const tenimg = 'const TENIMG=' + JSON.stringify(Object.fromEntries(fs.existsSync(c('assets/tenuta')) ? fs.readdirSync(c('assets/tenuta')).filter(f => f.endsWith('.webp')).map(f => [f.replace('.webp',''), 'data:image/webp;base64,' + fs.readFileSync(c('assets/tenuta/' + f)).toString('base64')]) : [])) + ';\n';
const js = mapimg + portimg + tenimg + fs.readdirSync(c('js')).filter(f => f.endsWith('.js')).sort()
  .map(f => fs.readFileSync(c('js/' + f), 'utf8')).join('');
const fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Spectral:wght@400;600&display=swap">';
const page = `<!doctype html>
<html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>NYMERIA</title>
${fonts}
<style>html{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);color-scheme:dark}body{margin:0}
${css}</style></head><body>
${body}<script>
${js}</script></body></html>
`;
const art = `<title>NYMERIA</title>
<meta name="claude:viewport-fit-sides" content="cover">
${fonts}
<style>
${css}</style>
${body}<script>
${js}</script>
`;
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), page);
fs.writeFileSync(path.join(root, 'dist/artifact.html'), art);
console.log('ok: dist/index.html', page.length, 'byte; dist/artifact.html', art.length, 'byte');
