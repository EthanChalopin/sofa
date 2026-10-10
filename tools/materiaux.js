/*
 * Écrit MATERIAUX.md : la liste de tout ce qu'il faut pour fabriquer le canapé.
 *
 *   node tools/materiaux.js                 avec la longueur du modèle (MOD.width)
 *   node tools/materiaux.js --largeur=180   pour une autre longueur de canapé
 *
 * Le document est entièrement recalculé à partir du modèle : ne pas le modifier à la main.
 * Ce qui reste « à remplir » (mousse, ouate) se saisit dans le bloc SOFT de js/sofa-bom.js.
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
var wood = ['chevron', 'plank', 'mdf18', 'mdf10'], uses = {};
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
    'Sous-total : **' + euro(subtotal(isHardware)) + '** (dont ' + euro(plan.estimated) + ' estimés).', '',
    'À façonner dans la chute de hêtre et le tourillon :', '',
    table(['Pièce', 'Qté', 'Dimensions', 'Matière'], ['cam', 'lever', 'pin'].map(function (id) {
      var p = part(id); return [p.name, p.qty, size(p), p.material];
    })));

// ---------------------------------------------------------------- mousse et ouate
var seatFoam = part('seatFoam'), backFoam = part('backFoam'), cover = model.cover;
var backH = backFoam.size[1], len = backFoam.size[0];
var foamRows = [
  ['Mousse d\'assise', 1, size(seatFoam), num(seatFoam.size[0] * seatFoam.size[1] * seatFoam.size[2] / 1000) + ' L', Bom.SOFT.seatFoam],
  ['Mousse du dossier, côté assise', 1, num(len) + ' × ' + num(backH) + ' × ' + num(M.back.foam[0]) + ' cm', num(len * backH * M.back.foam[0] / 1000) + ' L', Bom.SOFT.backFoam],
  ['Mousse du dossier, côté couchage', 1, num(len) + ' × ' + num(backH) + ' × ' + num(M.back.foam[1]) + ' cm', num(len * backH * M.back.foam[1] / 1000) + ' L', Bom.SOFT.backFoam]
].map(function (r) { return [r[0], r[1], r[2], r[3], fill(r[4].quality), fill(r[4].supplier), fill(r[4].reference), fill(r[4].price, ' €')]; });
add('', '## 3. Mousse', '',
    table(['Plaque', 'Qté', 'Dimensions', 'Volume', 'Densité et fermeté', 'Fournisseur', 'Référence', 'Prix'], foamRows), '',
    '- La mousse d\'assise se colle sur le plateau en MDF. Elle reçoit une entaille à chaque bout pour coiffer les flancs, ' +
    'et une saignée dessous pour le fourreau du tube : voir la pièce « Mousse d\'assise » dans la page.',
    '- Les deux plaques du dossier se collent de part et d\'autre du cadre. La plus épaisse est du côté qui devient le couchage.',
    '- Le prix des deux plaques du dossier se saisit en une seule ligne (`backFoam`).');

var seatWad = cover.seat.length * (cover.seat.depth + 2 * cover.seat.drop) / 1e4;
var backWad = cover.back.length * 2 * (cover.back.height + cover.back.thick) / 1e4;
add('', '## 4. Ouate', '',
    table(['Emplacement', 'Surface', 'Épaisseur posée', 'Grammage', 'Fournisseur', 'Référence', 'Prix'], [
      ['Assise : dessus, avant et arrière', num(seatWad) + ' m²', num(M.cover.wad) + ' cm', fill(Bom.SOFT.wadding.quality), fill(Bom.SOFT.wadding.supplier), fill(Bom.SOFT.wadding.reference), ''],
      ['Dossier : tout le tour, sauf les deux bouts', num(backWad) + ' m²', num(M.cover.wad) + ' cm', 'idem', 'idem', 'idem', ''],
      ['**Total**', '**' + num(seatWad + backWad) + ' m²**', '', '', '', '', fill(Bom.SOFT.wadding.price, ' €')]
    ]), '',
    '- Surfaces nettes, sans marge de coupe.',
    '- Pas de ouate sur les flancs de l\'assise : le tissu y est tendu à même le bois, pour laisser travailler le montant et le taquet.');

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
add('', '## 6. Réalisé à part', '', 'Les montants et les manchettes sont fabriqués par un ami : ils ne sont pas dans les achats.', '',
    table(['Pièce', 'Qté', 'Dimensions hors tout', 'Matière'], ['upright', 'pad'].map(function (id) {
      var p = part(id); return [p.name, p.qty, size(p), p.material];
    })));

var soft = [Bom.SOFT.seatFoam.price, Bom.SOFT.backFoam.price, Bom.SOFT.wadding.price];
var softKnown = soft.every(function (v) { return v !== null; });
add('', '## Récapitulatif', '',
    table(['Poste', 'Montant'], [
      ['Bois et panneaux', euro(subtotal(isWood))],
      ['Quincaillerie', euro(subtotal(isHardware))],
      ['Mousse', Bom.SOFT.seatFoam.price !== null && Bom.SOFT.backFoam.price !== null ? euro(Bom.SOFT.seatFoam.price + Bom.SOFT.backFoam.price) : TODO],
      ['Ouate', fill(Bom.SOFT.wadding.price, ' €')],
      ['Tissu', 'selon le tissu choisi (tableau du § 5)'],
      ['**Total hors tissu**', softKnown ? '**' + euro(plan.total + soft.reduce(function (t, v) { return t + v; }, 0)) + '**' : euro(plan.total) + ' + mousse et ouate']
    ]), '',
    'Ne sont pas comptés : la colle pour la mousse, les agrafes et le fil, la finition du bois apparent.', '');

if (plan.warnings.length) add('## À régler', '', plan.warnings.map(function (w) { return '- ' + w; }).join('\n'), '');

var file = path.join(__dirname, '..', 'MATERIAUX.md');
fs.writeFileSync(file, out.join('\n'));
console.log('→ ' + path.relative(process.cwd(), file));
