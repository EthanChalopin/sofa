/*
 * Embarque les photos de tissus (dossier tissus/) dans js/fabric-images.js.
 *
 *   node tools/tissus.js
 *
 * Pourquoi : la page s'ouvre par double-clic, et un navigateur refuse alors de plaquer un fichier image
 * sur un objet 3D. Une image écrite dans un fichier JavaScript, elle, est acceptée.
 * Le nom du fichier (sans .jpg) doit être l'identifiant du tissu dans js/fabrics.js.
 * Préparer l'image avant : un carré qui se répète sans raccord visible, 512 × 512 pixels.
 */
'use strict';

var fs = require('fs'), path = require('path');
var dir = path.join(__dirname, '..', 'tissus'), out = path.join(__dirname, '..', 'js', 'fabric-images.js');

var lines = fs.readdirSync(dir).filter(function (f) { return /\.jpe?g$/i.test(f); }).sort().map(function (f) {
  var id = f.replace(/\.jpe?g$/i, '');
  console.log(id + ' : ' + Math.round(fs.statSync(path.join(dir, f)).size / 1024) + ' Ko');
  return '  ' + JSON.stringify(id) + ': \'data:image/jpeg;base64,' + fs.readFileSync(path.join(dir, f)).toString('base64') + '\'';
});

fs.writeFileSync(out,
  '/* Fichier généré par tools/tissus.js à partir du dossier tissus/ : ne pas le modifier à la main. */\n' +
  '(typeof self !== \'undefined\' ? self : this).SofaFabricImages = {\n' + lines.join(',\n') + '\n};\n');
console.log('→ ' + path.relative(process.cwd(), out));
