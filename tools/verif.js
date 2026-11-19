/*
 * Contrôle géométrique du mécanisme, à relancer après toute modification du modèle.
 *
 *   node tools/verif.js                 avec la longueur du modèle (MOD.width)
 *   node tools/verif.js --largeur=180   pour une autre longueur de canapé
 *
 * Tout se joue de profil : le montant, la butée et le dossier garni sont ramenés à
 * leur contour dans le plan (d, hauteur), puis comparés dans chaque position et pendant les bascules.
 * Le code de sortie est 1 si un contrôle échoue.
 */
'use strict';

var path = require('path');
var Sofa = require(path.join(__dirname, '..', 'js', 'sofa-model.js'));

var arg = process.argv.slice(2).filter(function (a) { return /^--largeur=/.test(a); })[0];
if (arg) Sofa.MOD.width = Number(arg.split('=')[1]);

var m = Sofa.build(), half = m.seatDepth / 2, TOL = 0.05;
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
var back = placed(boxOutline(part('backCover').shapes[0]), m.pivot.back);
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

var A = m.angle;
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

// La butée est dans le plan du montant : il repose dessus en canapé, et la quitte en basculant vers le lit.
var stopS = part('stop').shapes.filter(function (s) { return s.x1 > 0; })[0], stopPt = [half - stopS.z, stopS.y];
var g = distance(stopPt, upright(A.sofa)) - stopS.r;
check('Canapé : le montant repose sur la butée', touches(g), 'jeu ' + cm(g));
// On part d'un cran après la position canapé, où le montant touche la butée.
g = sweep(A.sofa + (A.bed - A.sofa) / 400, A.bed, 399, function (a) { return distance(stopPt, upright(a)) - stopS.r; });
check('Bascule : le montant quitte la butée sans passer dessus', g > 0, 'jeu mini ' + cm(g));
g = Math.min(-distance(stopPt, panel), panelTop - stopPt[1]) - stopS.r;
check('La butée est en plein bois du flanc', g >= 1.5, 'bois autour ' + cm(g));
g = Math.hypot(stopPt[0] - (half - m.pivot.back.z), stopPt[1] - m.pivot.back.y) - stopS.r - Sofa.EST.pivot.r;
check('La butée est loin du boulon de pivot', g >= 3, 'bois entre les deux ' + cm(g));

var backLowCanape = lowest(back(A.sofa)) - seatTop;
check('Canapé : le dossier est au-dessus de l\'assise', backLowCanape > 0, 'jour ' + cm(backLowCanape));
g = highest(back(A.bed)) - seatTop;
check('Lit : le dossier rabattu est au niveau de l\'assise', touches(g), 'écart ' + cm(g));
g = seatFront - deepest(back(A.bed));
check('Lit : le dossier vient contre le bloc d\'assise', touches(g), 'écart ' + cm(g));
g = lowest(upright(A.bed));
check('Lit : la pointe des accoudoirs pose au sol', touches(g), 'hauteur ' + cm(g));
// Le contour du montant, fait de courbes raccordées, ne doit pas se recouper (une pièce qu'on peut découper).
var outline = part('upright').shapes[0].pts, crossings = 0;
function cross(a, b, c, d) {
  function side(p, q, r) { return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); }
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
}
outline.forEach(function (a, i) {
  for (var j = i + 2; j < outline.length; j++) {
    if (i === 0 && j === outline.length - 1) continue;
    if (cross(a, outline[i + 1], outline[j], outline[(j + 1) % outline.length])) crossings++;
  }
});
check('Le contour du montant ne se recoupe pas', crossings === 0, crossings + ' croisement(s)');

// Pendant toute la bascule, le dossier garni ne doit pas entrer dans les flancs en bois.
function intoPanels(outline) {
  return sweep(A.sofa, A.bed, 400, function (a) {
    var worst = Infinity;
    sampled(outline(a), 0.5).forEach(function (p) { worst = Math.min(worst, distance(p, panel)); });
    return worst;
  });
}
g = intoPanels(back);
check('Bascule : le dossier ne touche pas les flancs en bois', clear(g), 'jeu mini ' + cm(g));
// Le montant balaie tout ce qui se trouve dans son épaisseur (en x). Chaque obstacle n'est contrôlé que s'il y est.
function xSpan(id) {
  return part(id).shapes.map(function (s) {                 // la pièce du côté x > 0
    return s.x0 !== undefined ? [s.x0, s.x1] : [s.center[0] - s.size[0] / 2, s.center[0] + s.size[0] / 2];
  }).sort(function (a, b) { return b[1] - a[1]; })[0];
}
function sharesX(id, other) { var a = xSpan(other || 'upright'), b = xSpan(id); return Math.min(a[1], b[1]) - Math.max(a[0], b[0]) > 0; }
var seatBlock = boxOutline(part('seatCover').shapes[0]).map(function (p) { return [half - p[0], p[1]]; });
var backLow = back(A.sofa).reduce(function (lo, p) { return p[1] < lo[1] ? p : lo; });
g = backLow[0] - deepest(seatBlock);
console.log('  —      ' + 'Canapé : le bas du dossier dépasse derrière le bloc d\'assise'.padEnd(62) + (g > 0 ? cm(g) : 'non'));
[['panel', 'le flanc en bois', panel], ['seatCover', 'le bloc d\'assise garni', seatBlock]].forEach(function (o) {
  if (!sharesX(o[0])) { console.log('  —      ' + ('Montant et ' + o[1] + ' : pas dans le même plan').padEnd(62)); return; }
  g = sweep(A.sofa, A.bed, 400, function (a) {
    return Math.min.apply(null, sampled(upright(a), 0.3).map(function (p) { return distance(p, o[2]); }));
  });
  check('Bascule : le montant ne touche pas ' + o[1], clear(g), 'jeu mini ' + cm(g));
});

// Les vis des montants doivent prendre dans le cadre du dossier, à distance des chants du montant et du cadre.
var T = m.stem;
g = Math.min(T.screw - Math.max(T.front, T.frame[0]), Math.min(T.rear, T.frame[1]) - T.screw);
check('Les vis des montants prennent dans le cadre du dossier', g >= 1.5, 'à ' + cm(g) + ' du bord le plus proche');
// Le boulon de pivot traverse le flanc et l'un des deux tasseaux empilés derrière lui : pas à cheval sur leur joint.
var joint = Math.min.apply(null, part('brace').shapes[0].pts.map(function (p) { return p[1]; })), boltH = m.pivot.back.y;
g = Math.min(Math.abs(boltH - joint), boltH - lowest(panel), panelTop - boltH) - Sofa.EST.pivot.r;
check('Le boulon de pivot est en plein bois, loin du joint', g >= 1.5, 'bois autour ' + cm(g));

console.log(failed ? failed + ' contrôle(s) en échec.' : 'Tous les contrôles passent.');
process.exit(failed ? 1 : 0);
