/*
 * Liste d'achats, plan de coupe et contrôle de solidité, en ligne de commande.
 *
 *   node tools/debit.js                 avec la longueur du modèle (MOD.width)
 *   node tools/debit.js --largeur=180   pour essayer une autre longueur de canapé, en centimètres
 */
'use strict';

var path = require('path');
var Sofa = require(path.join(__dirname, '..', 'js', 'sofa-model.js'));
var Bom = require(path.join(__dirname, '..', 'js', 'sofa-bom.js'));
var Fabrics = require(path.join(__dirname, '..', 'js', 'fabrics.js'));

var arg = process.argv.slice(2).filter(function (a) { return /^--largeur=/.test(a); })[0];
if (arg) {
  var asked = Number(arg.split('=')[1]);
  if (!(asked > 0)) { console.error('Longueur invalide : ' + arg); process.exit(1); }
  Sofa.MOD.width = asked;
}

var model = Sofa.build(), plan = Bom.plan(model);
function euro(v) { return v.toFixed(2).replace('.', ',') + ' €'; }
function cm(v) { return String(Math.round(v * 10) / 10).replace('.', ','); }
function title(text) { console.log('\n' + text + '\n' + text.replace(/./g, '-')); }

console.log('Canapé de ' + cm(model.width) + ' cm de long (blocs), ' + cm(2 * model.overall.sofa.max[0]) + ' cm avec les montants.');

title('LISTE D\'ACHATS');
plan.lines.forEach(function (l) {
  console.log((l.qty + ' ×').padStart(4) + '  ' + l.name.padEnd(62) + euro(l.price).padStart(9) + euro(l.total).padStart(11) + (l.estimate ? '  (estimation)' : ''));
});
console.log(' '.repeat(68) + 'Relevé sur le site :' + euro(plan.checked).padStart(10));
console.log(' '.repeat(68) + 'Estimé :            ' + euro(plan.estimated).padStart(10));
console.log(' '.repeat(68) + 'TOTAL :             ' + euro(plan.total).padStart(10));

title('PLAN DE COUPE (trait de scie compté : ' + cm(Bom.KERF) + ' cm)');
plan.cutting.forEach(function (c) {
  console.log(c.name);
  (c.bars || []).forEach(function (bar, i) {
    console.log('   n° ' + (i + 1) + ' : ' + bar.pieces.map(function (p) { return cm(p.length) + ' (' + p.part + ')'; }).join(' + ') + '   → chute ' + cm(bar.left) + ' cm');
  });
  (c.panels || []).forEach(function (panel, i) {
    panel.strips.forEach(function (strip) {
      console.log('   n° ' + (i + 1) + ' : ' + strip.pieces.map(function (p) { return cm(p.length) + ' × ' + cm(p.width) + ' (' + p.part + ')'; }).join(' + '));
    });
  });
});

title('RÉCAPITULATIF DES PIÈCES');
Bom.pieces(model).filter(function (p) { return p.length; }).forEach(function (p) {
  console.log((p.qty + ' ×').padStart(4) + '  ' + p.part.padEnd(26) + cm(p.length) + (p.width ? ' × ' + cm(p.width) : '') + ' cm');
});

title('SOLIDITÉ (100 % = limite admise ; estimations)');
Bom.audit(model).forEach(function (r) {
  console.log((r.pct + ' %').padStart(6) + (r.pct > 100 ? '  !!  ' : '      ') + r.name.padEnd(34) + r.note);
});

title('TISSU (rayures d\'avant en arrière ; marge de coupe de 10 % comprise)');
console.log('Surface à couvrir : ' + cm(Bom.fabricNeed(model, Fabrics.list[0]).area) + ' m²');
Fabrics.list.forEach(function (f) {
  var need = Bom.fabricNeed(model, f);
  console.log('  ' + f.name.padEnd(38) + ('laize ' + f.width + ' cm').padEnd(15) + (need.turned ? 'en travers' : need.lays === 1 ? '1 lé' : need.lays + ' lés').padEnd(12) +
              (cm(need.metres) + ' m').padStart(7) + (cm(need.bought) + ' m²').padStart(10) + (need.price ? euro(need.price).padStart(11) : ''));
});

if (plan.warnings.length) {
  title('À RÉGLER');
  plan.warnings.forEach(function (w) { console.log(' - ' + w); });
}
