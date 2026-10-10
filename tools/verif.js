/*
 * Contrôle géométrique du mécanisme, à relancer après toute modification du modèle.
 *
 *   node tools/verif.js                 avec la longueur du modèle (MOD.width)
 *   node tools/verif.js --largeur=180   pour une autre longueur de canapé
 *
 * Tout se joue de profil : le montant en Y, le taquet, le dossier garni et la manchette sont ramenés à
 * leur contour dans le plan (d, hauteur), puis comparés dans chaque position et pendant les bascules.
 * Le code de sortie est 1 si un contrôle échoue.
 */
'use strict';

var path = require('path');
var Sofa = require(path.join(__dirname, '..', 'js', 'sofa-model.js'));

var arg = process.argv.slice(2).filter(function (a) { return /^--largeur=/.test(a); })[0];
if (arg) Sofa.MOD.width = Number(arg.split('=')[1]);

var m = Sofa.build(), half = Sofa.EST.panel.length / 2, TOL = 0.05;
function part(id) { return m.parts.filter(function (p) { return p.id === id; })[0]; }

// Point [z, y] d'un ensemble tournant → (d, hauteur), l'ensemble étant tourné de « a » autour de son axe.
function turn(pivot, pt, a) {
  return [half - (pivot.z + pt[1] * Math.sin(a) + pt[0] * Math.cos(a)), pivot.y + pt[1] * Math.cos(a) - pt[0] * Math.sin(a)];
}
// Contour [z, y] d'un pavé, éventuellement incliné (rotX).
function boxOutline(s) {
  var r = s.rotX || 0;
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (k) {
    var ly = k[1] * s.size[1] / 2, lz = k[0] * s.size[2] / 2;
    return [s.center[2] + ly * Math.sin(r) + lz * Math.cos(r), s.center[1] + ly * Math.cos(r) - lz * Math.sin(r)];
  });
}
function placed(outline, pivot) { return function (a) { return outline.map(function (p) { return turn(pivot, p, a); }); }; }

var upright = placed(part('upright').shapes[0].pts, m.pivot.back);
var cam = placed(part('cam').shapes[0].pts, m.pivot.cam);
var back = placed(boxOutline(part('backCover').shapes[0]), m.pivot.back);
var pad = placed(boxOutline(part('pad').shapes.filter(function (s) { return s.center[0] > 0; })[0]), m.pivot.back);
var panel = part('panel').shapes[0].pts.map(function (p) { return [half - p[0], p[1]]; });

function inside(p, poly) {
  var c = false;
  for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    var a = poly[i], b = poly[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
// Distance d'un point à un contour : négative s'il est dedans.
function distance(p, poly) {
  var best = Infinity;
  for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    var a = poly[i], b = poly[j], dx = b[0] - a[0], dy = b[1] - a[1];
    var t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy));
  }
  return inside(p, poly) ? -best : best;
}
function sampled(poly, step) {
  var out = [];
  poly.forEach(function (a, i) {
    var b = poly[(i + 1) % poly.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (var k = 0; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  });
  return out;
}
// Jeu entre deux contours : 0 s'ils se touchent, négatif s'ils se pénètrent.
function gap(A, B) {
  var best = Infinity;
  sampled(A, 0.15).forEach(function (p) { best = Math.min(best, distance(p, B)); });
  sampled(B, 0.3).forEach(function (p) { best = Math.min(best, distance(p, A)); });
  return best;
}
function sweep(from, to, steps, fn) {
  var worst = Infinity;
  for (var i = 0; i <= steps; i++) worst = Math.min(worst, fn(from + (to - from) * i / steps));
  return worst;
}
function lowest(poly) { return Math.min.apply(null, poly.map(function (p) { return p[1]; })); }
function highest(poly) { return Math.max.apply(null, poly.map(function (p) { return p[1]; })); }
function deepest(poly) { return Math.max.apply(null, poly.map(function (p) { return p[0]; })); }

var A = m.angle, C = m.cam;
var seatTop = m.overall.bed.max[1];                        // dessus fini de l'assise
var seatFront = half - m.overall.sofa.max[2];              // face avant finie du bloc d'assise (distance d)
var panelTop = highest(panel);
var failed = 0;
function check(name, ok, detail) {
  if (!ok) failed++;
  console.log((ok ? '  ok     ' : '  ÉCHEC  ') + name.padEnd(62) + detail);
}
function cm(v) { return (Math.round(v * 100) / 100).toFixed(2).replace('.', ',') + ' cm'; }
function touches(g) { return Math.abs(g) <= TOL; }
function clear(g) { return g >= -TOL; }

console.log('Canapé de ' + m.width + ' cm — contrôle du mécanisme (tolérance ' + cm(TOL) + ')');

var g = gap(cam(C.engaged), upright(A.sofa));
check('Position droite : le montant repose sur le nez du taquet', touches(g), 'jeu ' + cm(g));
g = gap(cam(C.retracted), upright(A.lounge));
check('Position détente : le montant repose sur le flanc du taquet', touches(g), 'jeu ' + cm(g));
g = sweep(C.engaged, C.retracted, 80, function (c) { return gap(cam(c), upright(A.lift)); });
check('Dossier soulagé : le taquet tourne sans toucher le montant', g > 0, 'jeu mini ' + cm(g));
g = Math.min.apply(null, C.follow.map(function (f) { return gap(cam(f[1]), upright(f[0])); }));
check('Retour : le taquet suit le montant sans le pénétrer', clear(g), 'jeu mini ' + cm(g));
g = sweep(A.sofa, A.bed, 300, function (a) { return gap(cam(C.engaged), upright(a)); });
check('Bascule vers le lit, taquet relevé : aucun contact', clear(g), 'jeu mini ' + cm(g));

g = lowest(back(A.lounge)) - seatTop;
check('Détente : le bas du dossier affleure l\'assise', touches(g), 'écart ' + cm(g));
g = lowest(back(A.sofa)) - seatTop;
check('Position droite : le dossier est au-dessus de l\'assise', g > 0, 'jour ' + cm(g));
g = highest(back(A.bed)) - seatTop;
check('Lit : le dossier rabattu est au niveau de l\'assise', touches(g), 'écart ' + cm(g));
g = seatFront - deepest(back(A.bed));
check('Lit : le dossier vient contre le bloc d\'assise', touches(g), 'écart ' + cm(g));
g = lowest(pad(A.bed));
check('Lit : les manchettes touchent le sol', touches(g), 'hauteur ' + cm(g));
g = seatFront - deepest(pad(A.bed));
check('Lit : les manchettes se posent devant le bloc d\'assise', g > 0, 'à ' + cm(g) + ' du bloc');

// Pendant toute la course, le dossier garni et les manchettes ne doivent pas entrer dans les flancs en bois.
function intoPanels(outline) {
  return sweep(A.lounge, A.bed, 400, function (a) {
    var worst = Infinity;
    sampled(outline(a), 0.5).forEach(function (p) { worst = Math.min(worst, distance(p, panel)); });
    return worst;
  });
}
g = intoPanels(back);
check('Bascule : le dossier ne touche pas les flancs en bois', clear(g), 'jeu mini ' + cm(g));
g = intoPanels(pad);
check('Bascule : les manchettes ne touchent pas les flancs en bois', clear(g), 'jeu mini ' + cm(g));
g = panelTop - (m.pivot.cam.y + Sofa.MOD.bar.r);
check('Le tube de commande passe sous le haut des flancs', g > 0, 'marge ' + cm(g));

console.log(failed ? failed + ' contrôle(s) en échec.' : 'Tous les contrôles passent.');
process.exit(failed ? 1 : 0);
