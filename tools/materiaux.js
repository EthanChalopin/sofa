/*
 * Écrit MATERIAUX.md : la liste de tout ce qu'il faut pour fabriquer le canapé.
 *
 *   node tools/materiaux.js                 avec la longueur du modèle (MOD.width)
 *   node tools/materiaux.js --largeur=180   pour une autre longueur de canapé
 *
 * Le document est entièrement recalculé à partir du modèle : ne pas le modifier à la main.
 * Ce qui reste « à remplir » (la ouate) se saisit dans le bloc SOFT de js/sofa-bom.js, où se trouve aussi le prix de la mousse.
 */
'use strict';

var fs = require('fs'), path = require('path');
var Sofa = require(path.join(__dirname, '..', 'js', 'sofa-model.js'));
var Bom = require(path.join(__dirname, '..', 'js', 'sofa-bom.js'));
var Fabrics = require(path.join(__dirname, '..', 'js', 'fabrics.js'));

var arg = process.argv.slice(2).filter(function (a) { return /^--largeur=/.test(a); })[0];
if (arg) Sofa.MOD.width = Number(arg.split('=')[1]);

var PRICES_READ = 'les 5 et 6 octobre 2026';               // date des relevés de prix sur les sites des vendeurs
var SELLERS = { 'tissus-hemmers.fr': 'Tissus Hemmers', 'mondialtissus.fr': 'Mondial Tissus', 'mercerine.com': 'Mercerine', 'etoffe.com': 'Etoffe.com' };
var TODO = '**à remplir**';

var model = Sofa.build(), plan = Bom.plan(model), M = Sofa.MOD;
function part(id) { return model.parts.filter(function (p) { return p.id === id; })[0]; }
function num(v) { return String(Math.round(v * 10) / 10).replace('.', ','); }
function euro(v) { return v.toFixed(2).replace('.', ',') + ' €'; }
function fill(v, unit) { return v === null || v === undefined ? TODO : v + (unit || ''); }
function size(p) { return p.size.map(num).join(' × ') + ' cm'; }
function table(head, rows) {
  var cell = function (c) { return String(c).replace(/\|/g, '/'); };
  return ['| ' + head.join(' | ') + ' |', '|' + head.map(function () { return '---'; }).join('|') + '|']
    .concat(rows.map(function (r) { return '| ' + r.map(cell).join(' | ') + ' |'; })).join('\n');
}
function seller(fabric) {
  var host = Object.keys(SELLERS).filter(function (h) { return fabric.url && fabric.url.indexOf(h) >= 0; })[0];
  return host ? SELLERS[host] : '—';
}

var out = [];
function add() { out.push(Array.prototype.join.call(arguments, '\n')); }

add('# Liste des matériaux',
    '',
    'Canapé de **' + num(model.width) + ' cm** de long (' + num(2 * model.overall.sofa.max[0]) + ' cm avec les montants). ' +
    'Liste calculée le ' + new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + '.',
    '',
    '> - Document généré par `node tools/materiaux.js` : il se recalcule si une cote change, donc ne pas le modifier à la main.',
    '> - Ce qui est marqué « à remplir » se saisit dans le bloc `SOFT` de `js/sofa-bom.js`.',
    '> - Prix relevés sur les sites des vendeurs ' + PRICES_READ + ' : à vérifier avant d\'acheter.');

// ---------------------------------------------------------------- bois, panneaux, quincaillerie
var wood = ['chevron', 'plank', 'mdf18', 'mdf10', 'dowel'], uses = {};
Bom.pieces(model).forEach(function (p) {
  (uses[p.stock] = uses[p.stock] || []).push(p.qty + ' × ' + p.part.toLowerCase() + (p.length ? ' de ' + num(p.length) + (p.width ? ' × ' + num(p.width) : '') + ' cm' : ''));
});
function lines(keep) {
  return plan.lines.filter(keep).map(function (l) {
    return [l.name + (l.estimate ? ' *(estimation)*' : ''), l.qty, euro(l.price), euro(l.total), (uses[l.key] || []).join(' ; ') || '—'];
  });
}
function subtotal(keep) { return plan.lines.filter(keep).reduce(function (t, l) { return t + l.total; }, 0); }
var isWood = function (l) { return wood.indexOf(l.key) >= 0; }, isHardware = function (l) { return !isWood(l); };

add('', '## 1. Bois et panneaux', '', 'Magasin : Leroy Merlin.', '',
    table(['Article', 'Qté', 'Prix', 'Total', 'Sert à'], lines(isWood)), '',
    'Sous-total : **' + euro(subtotal(isWood)) + '**');

add('', '### Plan de coupe', '', 'Trait de scie compté : ' + num(Bom.KERF * 10) + ' mm.', '');
plan.cutting.filter(function (c) { return wood.indexOf(c.key) >= 0; }).forEach(function (c) {
  var rows = (c.bars || []).map(function (bar, i) {
    return [i + 1, bar.pieces.map(function (p) { return num(p.length) + ' (' + p.part.toLowerCase() + ')'; }).join(' + '), num(bar.left) + ' cm'];
  });
  (c.panels || []).forEach(function (panel, i) {
    panel.strips.forEach(function (strip) {
      rows.push([i + 1, strip.pieces.map(function (p) { return num(p.length) + ' × ' + num(p.width) + ' (' + p.part.toLowerCase() + ')'; }).join(' + '), '—']);
    });
  });
  add('**' + c.name + '**', '', table(['N°', 'Coupes (cm)', 'Chute'], rows), '');
});

add('## 2. Quincaillerie', '',
    table(['Article', 'Qté', 'Prix', 'Total', 'Sert à'], lines(isHardware)), '',
    'Sous-total : **' + euro(subtotal(isHardware)) + '** (dont ' + euro(plan.estimated) + ' estimés).');

// ---------------------------------------------------------------- mousse et ouate
var seatFoam = part('seatFoam'), backFoam = part('backFoam'), cover = model.cover;
var backH = backFoam.size[1], len = backFoam.size[0];
var Q = Bom.FOAM_QUOTE;
var sameBack = M.back.foam[0] === M.back.foam[1];         // deux plaques identiques : une seule ligne à commander
var foams = [{ name: 'Mousse d\'assise', qty: 1, size: seatFoam.size, soft: Bom.SOFT.seatFoam }].concat(sameBack ? [
  { name: 'Mousse du dossier', qty: 2, size: [len, backH, M.back.foam[0]], soft: Bom.SOFT.backFoam }
] : [
  { name: 'Mousse du dossier, côté assise', qty: 1, size: [len, backH, M.back.foam[0]], soft: Bom.SOFT.backFoam },
  { name: 'Mousse du dossier, côté couchage', qty: 1, size: [len, backH, M.back.foam[1]], soft: Bom.SOFT.backFoam }
]);
foams.forEach(function (f) {
  f.litres = f.qty * f.size[0] * f.size[1] * f.size[2] / 1000;
  f.price = f.soft.perLitre === null ? null : f.litres * f.soft.perLitre;
});
var foamKnown = foams.every(function (f) { return f.price !== null; });
var foamTotal = foamKnown ? foams.reduce(function (t, f) { return t + f.price; }, 0) : null;
// Ce que le configurateur du vendeur ne sait pas découper tel quel.
var foamLimits = [];
foams.forEach(function (f) {
  if (f.size[2] < Q.minThick) foamLimits.push('- **À vérifier avant de commander** : la plaque « ' + f.name.toLowerCase() + ' » fait ' + num(f.size[2]) +
    ' cm d\'épaisseur, sous le minimum du sur-mesure (' + Q.minThick + ' cm). Elle ne se commande que si ' + num(f.size[2]) + ' cm figure dans les épaisseurs standard du site.');
  if (Math.max(f.size[0], f.size[1]) > Q.maxSide) foamLimits.push('- **À régler** : la plaque « ' + f.name.toLowerCase() + ' » dépasse les ' + Q.maxSide +
    ' cm que le site sait découper : elle est à commander en deux morceaux ou ailleurs.');
});
add('', '## 3. Mousse', '',
    table(['Plaque', 'Qté', 'Dimensions', 'Volume', 'Densité et fermeté', 'Fournisseur', 'Référence', 'Prix'], foams.map(function (f) {
      return [f.name, f.qty, f.size.map(num).join(' × ') + ' cm', num(f.litres) + ' L', fill(f.soft.quality), fill(f.soft.supplier), fill(f.soft.reference),
              f.price === null ? TODO : euro(f.price) + ' *(estimation)*'];
    })), '',
    foamKnown ? 'Sous-total : **' + euro(foamTotal) + '** (estimation, hors frais de port).' : 'Sous-total : ' + TODO, '',
    '- Prix estimés au prorata du volume, à partir d\'un seul prix relevé sur matelaspourtous.com le ' + Q.read + ' : ' + euro(Q.price) +
    ' la plaque de ' + Q.size.map(num).join(' × ') + ' cm, soit ' + euro(Q.price / (Q.size[0] * Q.size[1] * Q.size[2] / 1000)) + ' le litre. ' +
    'Le site ne facture pas forcément au volume exact, et les frais de port ne sont pas comptés : saisir chaque plaque dans son configurateur avant de commander.',
    '- Ce prix est celui d\'une épaisseur standard. Le site annonce le standard 30 % moins cher : pour une épaisseur hors de sa liste, compter environ 43 % de plus.',
    foamLimits.concat([
      '- La mousse d\'assise se colle sur le plateau en MDF. Elle reçoit une entaille à chaque bout pour coiffer les flancs : ' +
      'voir la pièce « Mousse d\'assise » dans la page.',
      '- Les deux plaques du dossier se collent de part et d\'autre du cadre.' + (sameBack ? '' : ' Celle de ' + num(M.back.foam[0]) + ' cm va du côté où l\'on s\'adosse, celle de ' + num(M.back.foam[1]) + ' cm du côté qui devient le couchage.')
    ]).join('\n'));

var seatWad = cover.seat.length * (cover.seat.depth + 2 * cover.seat.drop) / 1e4;
var backWad = cover.back.length * 2 * (cover.back.height + cover.back.thick) / 1e4;
add('', '## 4. Ouate', '',
    table(['Emplacement', 'Surface', 'Épaisseur posée', 'Grammage', 'Fournisseur', 'Référence', 'Prix'], [
      ['Assise : dessus, avant et arrière', num(seatWad) + ' m²', num(M.cover.wad) + ' cm', fill(Bom.SOFT.wadding.quality), fill(Bom.SOFT.wadding.supplier), fill(Bom.SOFT.wadding.reference), ''],
      ['Dossier : tout le tour, sauf les deux bouts', num(backWad) + ' m²', num(M.cover.wad) + ' cm', 'idem', 'idem', 'idem', ''],
      ['**Total**', '**' + num(seatWad + backWad) + ' m²**', '', '', '', '', Bom.SOFT.wadding.price === null ? TODO : euro(Bom.SOFT.wadding.price)]
    ]), '',
    '- Surfaces nettes, sans marge de coupe.',
    '- Pas de ouate sur les flancs de l\'assise : le tissu y est tendu à même le bois, pour laisser travailler le montant.');

// ---------------------------------------------------------------- tissu
var first = Bom.fabricNeed(model, Fabrics.list[0]);
add('', '## 5. Tissu', '',
    'Surface à couvrir : **' + num(first.area) + ' m²** (les deux blocs, sans le dessous de l\'assise). ' +
    'Un seul tissu à choisir parmi les ' + Fabrics.list.length + ' ci-dessous.', '',
    'Le métrage à acheter dépasse cette surface : le tissu se vend au mètre dans une largeur fixe, et il faut le plus souvent ' +
    'plusieurs largeurs cousues côte à côte. Il compte les coutures, 5 cm de retour agrafé sous le cadre, le raccord du motif ' +
    'quand il est connu et 10 % de marge.', '',
    table(['Tissu', 'Vendeur', 'Laize', 'Prix au mètre', 'À acheter', 'Soit', 'Prix', 'Pose'], Fabrics.list.map(function (f) {
      var need = Bom.fabricNeed(model, f);
      var lay = need.turned ? 'tourné d\'un quart de tour, sans couture' : need.lays === 1 ? '1 largeur, sans couture' : need.lays + ' largeurs par bloc';
      return [f.name, seller(f), f.width + ' cm', f.price ? euro(f.price) : '—', num(need.metres) + ' m', num(need.bought) + ' m²',
              need.price ? euro(need.price) : '—', lay + (need.along ? ', rayures dans la longueur' : '')];
    })), '', '### Détail de chaque tissu', '',
    Fabrics.list.map(function (f) { return '- **' + f.name + '** — ' + f.note + (f.url ? ' [Fiche du vendeur](' + f.url + ')' : ''); }).join('\n'));

// ---------------------------------------------------------------- hors liste, total
add('', '## 6. Réalisé à part', '', 'Les montants sont fabriqués par un ami : ils ne sont pas dans les achats.', '',
    table(['Pièce', 'Qté', 'Dimensions hors tout', 'Matière'], ['upright'].map(function (id) {
      var p = part(id); return [p.name, p.qty, size(p), p.material];
    })));

var wadPrice = Bom.SOFT.wadding.price;
var known = plan.total + (foamTotal || 0) + (wadPrice || 0);
var missing = [foamKnown ? null : 'mousse', wadPrice === null ? 'ouate' : null].filter(Boolean);
add('', '## Récapitulatif', '',
    table(['Poste', 'Montant'], [
      ['Bois et panneaux', euro(subtotal(isWood))],
      ['Quincaillerie', euro(subtotal(isHardware))],
      ['Mousse', foamKnown ? euro(foamTotal) + ' *(estimation)*' : TODO],
      ['Ouate', wadPrice === null ? TODO : euro(wadPrice)],
      ['Tissu', 'selon le tissu choisi (tableau du § 5)'],
      ['**Total hors tissu**', missing.length ? euro(known) + ' + ' + missing.join(' et ') : '**' + euro(known) + '**']
    ]), '',
    'Ne sont pas comptés : la colle pour la mousse, les agrafes et le fil, la finition du bois apparent.', '');

if (plan.warnings.length) add('## À régler', '', plan.warnings.map(function (w) { return '- ' + w; }).join('\n'), '');

var file = path.join(__dirname, '..', 'MATERIAUX.md');
fs.writeFileSync(file, out.join('\n'));
console.log('→ ' + path.relative(process.cwd(), file));
